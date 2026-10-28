// Logika murni untuk proxy Gemini. Sengaja TANPA import Netlify supaya bisa
// diuji di Node dengan fetch palsu (lihat proxyCore.test.js).
//
// Prinsip keamanan:
//  - API key hanya dibaca dari env server (GEMINI_API_KEY), tidak pernah dikirim ke klien.
//  - Klien TIDAK boleh memilih model; ia hanya memilih slot "primary"/"fallback".
//  - Batas ukuran body/prompt, batas token keluaran, dan timeout upstream.
//  - Hanya same-origin (atau ALLOWED_ORIGINS) yang boleh memanggil.
//  - Isi prompt TIDAK pernah dicatat di log (teks jurnal bersifat sensitif).

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.8-flash";

export const LIMITS = {
  maxBodyChars: 20_000,
  maxPromptChars: 8_000,
  maxOutputTokens: 2048,
  upstreamTimeoutMs: 18_000, // < timeout klien (20 dtk) agar error-nya bersih
};

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function reply(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(status === 405 ? { allow: "POST" } : {}),
    },
  });
}

const clean = (v) => String(v ?? "").trim();

function hostOf(value) {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Same-origin check. Browser selalu mengirim header Origin pada POST fetch.
 * Ini menghentikan situs lain memakai proxy-mu dari browser pengunjung. Ini
 * BUKAN autentikasi: skrip non-browser bisa memalsukan header. Perlindungan
 * terhadap penyalahgunaan sungguhan = rate limit Netlify + kuota di Google.
 */
export function isAllowedOrigin(req, env = {}) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  const requestHosts = new Set(
    [
      ...(req.headers.get("x-forwarded-host") ?? "").split(","),
      req.headers.get("host") ?? "",
      hostOf(req.url) ?? "",
    ]
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );
  if (requestHosts.has(parsed.host.toLowerCase())) return true;
  return clean(env.ALLOWED_ORIGINS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(parsed.origin);
}

export function pickModel(slot, env = {}) {
  const primary = clean(env.GEMINI_MODEL) || DEFAULT_MODEL;
  const fallback = clean(env.GEMINI_FALLBACK_MODEL) || primary;
  const model = slot === "fallback" ? fallback : primary;
  // Cegah karakter aneh (spasi/newline hasil salah tempel di Netlify) masuk URL.
  return /^[a-z0-9][a-z0-9._-]*$/i.test(model) ? model : null;
}

function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p) => typeof p?.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("");
}

/**
 * @param {Request} req
 * @param {{ env: Record<string,string|undefined>, fetchImpl?: typeof fetch, log?: (line: string) => void }} deps
 * @returns {Promise<Response>}
 */
export async function handleGeminiRequest(
  req,
  { env, fetchImpl = fetch, log = console.log },
) {
  const started = Date.now();
  const record = (extra) =>
    log(JSON.stringify({ evt: "gemini_proxy", ms: Date.now() - started, ...extra }));

  if (req.method !== "POST") {
    return reply(405, { error: "METHOD_NOT_ALLOWED", retryable: false });
  }
  if (!isAllowedOrigin(req, env)) {
    record({ status: 403, reason: "origin" });
    return reply(403, { error: "FORBIDDEN", retryable: false });
  }

  const raw = await req.text();
  if (raw.length > LIMITS.maxBodyChars) {
    return reply(413, { error: "PAYLOAD_TOO_LARGE", retryable: false });
  }
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, { error: "INVALID_JSON", retryable: false });
  }

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length > LIMITS.maxPromptChars) {
    return reply(400, { error: "INVALID_PROMPT", retryable: false });
  }
  const slot = body?.slot === "fallback" ? "fallback" : "primary";

  const apiKey = clean(env.GEMINI_API_KEY);
  const model = pickModel(slot, env);
  if (!apiKey || !model) {
    record({ status: 500, reason: !apiKey ? "missing_key" : "bad_model_env" });
    return reply(500, { error: "SERVER_MISCONFIGURED", retryable: false });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.upstreamTimeoutMs);
  let upstream;
  try {
    upstream = await fetchImpl(`${GEMINI_BASE}/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: LIMITS.maxOutputTokens,
          // 3.8 Flash default = medium (lambat). "MINIMAL" ditolak oleh 3.8 Flash.
          thinkingConfig: { thinkingLevel: "LOW" },
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    const timedOut = err?.name === "AbortError";
    record({ slot, model, status: timedOut ? 504 : 502, reason: timedOut ? "timeout" : "network" });
    return reply(timedOut ? 504 : 502, {
      error: timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNREACHABLE",
      retryable: true,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!upstream.ok) {
    record({ slot, model, status: upstream.status, upstream: true });
    if (upstream.status === 404) {
      return reply(404, { error: "MODEL_NOT_FOUND", retryable: false });
    }
    if (RETRYABLE_STATUS.has(upstream.status)) {
      return reply(upstream.status, {
        error: upstream.status === 429 ? "RATE_LIMITED" : "UNAVAILABLE",
        retryable: true,
      });
    }
    // 400/401/403 dari Google = key/permintaan bermasalah. Detail hanya ada di
    // log server; klien cukup tahu bahwa mengulang tidak akan membantu.
    return reply(424, {
      error: "UPSTREAM_REJECTED",
      upstreamStatus: upstream.status,
      retryable: false,
    });
  }

  let data;
  try {
    data = await upstream.json();
  } catch {
    record({ slot, model, status: 502, reason: "bad_upstream_json" });
    return reply(502, { error: "BAD_UPSTREAM_RESPONSE", retryable: true });
  }

  const text = extractText(data);
  if (!text.trim()) {
    const finishReason = data?.candidates?.[0]?.finishReason ?? null;
    const blockReason = data?.promptFeedback?.blockReason ?? null;
    record({ slot, model, status: 422, finishReason, blockReason });
    return reply(422, {
      error: "EMPTY_RESPONSE",
      retryable: !blockReason && finishReason !== "SAFETY",
    });
  }

  record({ slot, model, status: 200 });
  return reply(200, { text, model });
}
