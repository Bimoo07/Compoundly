import { describe, it, expect, vi, afterEach } from "vitest";
import { handleGeminiRequest, isAllowedOrigin, pickModel, LIMITS } from "./proxyCore.mjs";

const SITE = "https://compoundly.example";
const KEY = "TEST-KEY-SHOULD-NEVER-LEAK";
const ENV = { GEMINI_API_KEY: KEY, GEMINI_MODEL: "model-a", GEMINI_FALLBACK_MODEL: "model-b" };

function makeReq({ method = "POST", origin = SITE, body = { prompt: "halo" }, raw } = {}) {
  const headers = { "content-type": "application/json" };
  if (origin) headers.origin = origin;
  return new Request(`${SITE}/api/gemini`, {
    method,
    headers,
    body: method === "GET" ? undefined : (raw ?? JSON.stringify(body)),
  });
}

const geminiOk = (text = '{"ok":true}') =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });

const run = (req, { env = ENV, fetchImpl = async () => geminiOk() } = {}) => {
  const lines = [];
  return handleGeminiRequest(req, { env, fetchImpl, log: (l) => lines.push(l) }).then(
    async (res) => ({ res, json: await res.json(), lines }),
  );
};

afterEach(() => vi.useRealTimers());

describe("akses", () => {
  it("menolak method selain POST", async () => {
    const { res } = await run(makeReq({ method: "GET" }));
    expect(res.status).toBe(405);
  });

  it("menolak request tanpa Origin dan dengan Origin situs lain", async () => {
    expect((await run(makeReq({ origin: null }))).res.status).toBe(403);
    expect((await run(makeReq({ origin: "https://evil.example" }))).res.status).toBe(403);
  });

  it("menerima same-origin dan origin tambahan dari ALLOWED_ORIGINS", async () => {
    expect((await run(makeReq())).res.status).toBe(200);
    const req = makeReq({ origin: "https://custom.example" });
    expect(isAllowedOrigin(req, {})).toBe(false);
    expect(isAllowedOrigin(req, { ALLOWED_ORIGINS: "https://a.example, https://custom.example" })).toBe(true);
  });

  it("tidak memanggil Google kalau akses ditolak", async () => {
    const fetchImpl = vi.fn();
    await run(makeReq({ origin: null }), { fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("validasi input", () => {
  it("menolak JSON rusak, prompt kosong, dan prompt terlalu panjang", async () => {
    expect((await run(makeReq({ raw: "{bukan json" }))).res.status).toBe(400);
    expect((await run(makeReq({ body: { prompt: "   " } }))).res.status).toBe(400);
    expect((await run(makeReq({ body: {} }))).res.status).toBe(400);
    const long = "x".repeat(LIMITS.maxPromptChars + 1);
    expect((await run(makeReq({ body: { prompt: long } }))).res.status).toBe(400);
  });

  it("menolak body yang terlalu besar dengan 413", async () => {
    const raw = JSON.stringify({ prompt: "x", pad: "y".repeat(LIMITS.maxBodyChars) });
    expect((await run(makeReq({ raw }))).res.status).toBe(413);
  });

  it("mengabaikan field model dari klien (klien tidak boleh memilih model)", async () => {
    const fetchImpl = vi.fn(async () => geminiOk());
    await run(makeReq({ body: { prompt: "halo", model: "gemini-mahal-sekali" } }), { fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toContain("/models/model-a:generateContent");
  });
});

describe("konfigurasi server", () => {
  it("500 bila GEMINI_API_KEY tidak ada, tanpa membocorkan apa pun", async () => {
    const { res, json } = await run(makeReq(), { env: { ...ENV, GEMINI_API_KEY: "" } });
    expect(res.status).toBe(500);
    expect(json.error).toBe("SERVER_MISCONFIGURED");
  });

  it("memilih model sesuai slot; fallback default ke primary; default 3.8 flash", () => {
    expect(pickModel("primary", ENV)).toBe("model-a");
    expect(pickModel("fallback", ENV)).toBe("model-b");
    expect(pickModel("fallback", { GEMINI_MODEL: "model-a" })).toBe("model-a");
    expect(pickModel("primary", {})).toBe("gemini-3.8-flash");
  });

  it("menolak nama model berkarakter aneh (mis. salah tempel di Netlify)", async () => {
    expect(pickModel("primary", { GEMINI_MODEL: "model a/../x" })).toBeNull();
    const { res } = await run(makeReq(), { env: { ...ENV, GEMINI_MODEL: "model a/../x" } });
    expect(res.status).toBe(500);
  });

  it("men-trim spasi di nilai env", () => {
    expect(pickModel("primary", { GEMINI_MODEL: "  model-a \n" })).toBe("model-a");
  });
});

describe("panggilan ke Google", () => {
  it("mengirim key lewat header, thinking LOW, JSON mode, dan batas token", async () => {
    const fetchImpl = vi.fn(async () => geminiOk());
    await run(makeReq({ body: { prompt: "halo", slot: "fallback" } }), { fetchImpl });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/model-b:generateContent");
    expect(url).not.toContain(KEY);
    expect(init.headers["x-goog-api-key"]).toBe(KEY);
    const sent = JSON.parse(init.body);
    expect(sent.contents[0].parts[0].text).toBe("halo");
    expect(sent.generationConfig.thinkingConfig.thinkingLevel).toBe("LOW");
    expect(sent.generationConfig.responseMimeType).toBe("application/json");
    expect(sent.generationConfig.maxOutputTokens).toBe(LIMITS.maxOutputTokens);
  });

  it("mengembalikan text + model, dan menggabung part non-thought saja", async () => {
    const upstream = new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: "rahasia-pikiran", thought: true }, { text: '{"a":' }, { text: "1}" }] } }],
      }),
    );
    const { res, json } = await run(makeReq(), { fetchImpl: async () => upstream });
    expect(res.status).toBe(200);
    expect(json).toEqual({ text: '{"a":1}', model: "model-a" });
  });

  it("503/429 diteruskan sebagai retryable; isi error Google tidak diteruskan", async () => {
    const up = (status) => async () =>
      new Response(JSON.stringify({ error: { message: "isi-internal-google" } }), { status });
    const r503 = await run(makeReq(), { fetchImpl: up(503) });
    expect(r503.res.status).toBe(503);
    expect(r503.json).toEqual({ error: "UNAVAILABLE", retryable: true });
    const r429 = await run(makeReq(), { fetchImpl: up(429) });
    expect(r429.json).toEqual({ error: "RATE_LIMITED", retryable: true });
    expect(JSON.stringify(r503.json)).not.toContain("isi-internal-google");
  });

  it("404 = MODEL_NOT_FOUND (tidak retryable); 400/401/403 = 424 tidak retryable", async () => {
    const up = (status) => async () => new Response("{}", { status });
    const r404 = await run(makeReq(), { fetchImpl: up(404) });
    expect(r404.res.status).toBe(404);
    expect(r404.json).toEqual({ error: "MODEL_NOT_FOUND", retryable: false });
    for (const s of [400, 401, 403]) {
      const r = await run(makeReq(), { fetchImpl: up(s) });
      expect(r.res.status).toBe(424);
      expect(r.json.retryable).toBe(false);
      expect(r.json.upstreamStatus).toBe(s);
    }
  });

  it("jaringan putus = 502 retryable", async () => {
    const { res, json } = await run(makeReq(), {
      fetchImpl: async () => {
        throw new TypeError("fetch failed");
      },
    });
    expect(res.status).toBe(502);
    expect(json.retryable).toBe(true);
  });

  it("memutus panggilan upstream setelah batas waktu dan membalas 504", async () => {
    vi.useFakeTimers();
    const hang = (_url, { signal }) =>
      new Promise((_, reject) =>
        signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))),
      );
    const pending = run(makeReq(), { fetchImpl: hang });
    await vi.advanceTimersByTimeAsync(LIMITS.upstreamTimeoutMs + 1);
    const { res, json } = await pending;
    expect(res.status).toBe(504);
    expect(json).toEqual({ error: "UPSTREAM_TIMEOUT", retryable: true });
  });

  it("respons kosong = 422; diblokir keamanan = tidak retryable", async () => {
    const empty = async () => new Response(JSON.stringify({ candidates: [{ finishReason: "STOP" }] }));
    expect((await run(makeReq(), { fetchImpl: empty })).json).toEqual({ error: "EMPTY_RESPONSE", retryable: true });
    const blocked = async () => new Response(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } }));
    expect((await run(makeReq(), { fetchImpl: blocked })).json.retryable).toBe(false);
  });
});

describe("privasi", () => {
  it("log tidak memuat isi prompt maupun API key", async () => {
    const secretPrompt = "isi jurnal yang sangat pribadi 12345";
    const { lines } = await run(makeReq({ body: { prompt: secretPrompt } }));
    const all = lines.join("\n");
    expect(all).toContain("gemini_proxy");
    expect(all).not.toContain(secretPrompt);
    expect(all).not.toContain(KEY);
  });
});
