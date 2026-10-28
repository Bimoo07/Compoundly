import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { suggestHabitsFromNarrative } from "./geminiClient";

const ok = (text) =>
  new Response(JSON.stringify({ text, model: "m" }), { status: 200 });
const fail = (status, body) =>
  new Response(body === undefined ? "<html>platform</html>" : JSON.stringify(body), { status });

const HABITS = '{"habits":[{"id":"a","label":"Latihan 10 menit"}]}';

let fetchMock;
beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Jalankan pemanggilan sambil memajukan timer; kembalikan hasil atau error-nya. */
async function settle(promise, ms = 120000) {
  const wrapped = promise.then(
    (value) => ({ value }),
    (error) => ({ error }),
  );
  await vi.advanceTimersByTimeAsync(ms);
  return wrapped;
}

const slots = () => fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).slot);

describe("geminiClient lewat proxy /api/gemini", () => {
  it("memanggil proxy (bukan Google), tanpa key, dan mem-parse JSON", async () => {
    fetchMock.mockResolvedValueOnce(ok(HABITS));
    const { value } = await settle(suggestHabitsFromNarrative("aku ingin olahraga"));
    expect(value.habits[0].label).toBe("Latihan 10 menit");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/gemini");
    const sent = JSON.parse(init.body);
    expect(sent.slot).toBe("primary");
    expect(sent.prompt).toContain("aku ingin olahraga");
    expect(Object.keys(sent).sort()).toEqual(["prompt", "slot"]);
    expect(JSON.stringify(init.headers)).not.toMatch(/key/i);
  });

  it("mengulang saat 503 dan berganti ke slot fallback", async () => {
    fetchMock
      .mockResolvedValueOnce(fail(503, { error: "UNAVAILABLE", retryable: true }))
      .mockResolvedValueOnce(ok(HABITS));
    const { value } = await settle(suggestHabitsFromNarrative("x"));
    expect(value.habits).toHaveLength(1);
    expect(slots()).toEqual(["primary", "fallback"]);
  });

  it("menyerah setelah 4 percobaan dengan pesan Indonesia yang ramah", async () => {
    fetchMock.mockImplementation(async () => fail(503, { error: "UNAVAILABLE", retryable: true }));
    const { error } = await settle(suggestHabitsFromNarrative("x"));
    expect(slots()).toEqual(["primary", "fallback", "primary", "fallback"]);
    expect(error.message).toMatch(/sedang sibuk/i);
  });

  it("tidak mengulang error permanen (model tidak ada, ditolak, forbidden)", async () => {
    const cases = [
      [404, { error: "MODEL_NOT_FOUND", retryable: false }, /GEMINI_MODEL/],
      [424, { error: "UPSTREAM_REJECTED", retryable: false }, /belum dikonfigurasi/i],
      [403, { error: "FORBIDDEN", retryable: false }, /ditolak/i],
    ];
    for (const [status, body, message] of cases) {
      fetchMock.mockReset();
      fetchMock.mockResolvedValueOnce(fail(status, body));
      const { error } = await settle(suggestHabitsFromNarrative("x"));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(error.message).toMatch(message);
    }
  });

  it("memperlakukan 404 tanpa JSON sebagai endpoint yang tidak ada (mis. vite dev biasa)", async () => {
    fetchMock.mockResolvedValueOnce(fail(404));
    const { error } = await settle(suggestHabitsFromNarrative("x"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(error.message).toMatch(/netlify dev|VITE_USE_MOCK_AI/);
  });

  it("429 dari platform (body bukan JSON) tetap dianggap sementara", async () => {
    fetchMock.mockResolvedValueOnce(fail(429)).mockResolvedValueOnce(ok(HABITS));
    const { value } = await settle(suggestHabitsFromNarrative("x"));
    expect(value.habits).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("jaringan putus dianggap sementara", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(ok(HABITS));
    const { value } = await settle(suggestHabitsFromNarrative("x"));
    expect(value.habits).toHaveLength(1);
  });

  it("memutus percobaan yang menggantung dan menghormati batas waktu total", async () => {
    fetchMock.mockImplementation(
      (_url, { signal }) =>
        new Promise((_, reject) =>
          signal.addEventListener("abort", () => reject(Object.assign(new Error("abort"), { name: "AbortError" }))),
        ),
    );
    const { error } = await settle(suggestHabitsFromNarrative("x"));
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(3);
    expect(error.message).toMatch(/terlalu lama/i);
  });

  it("respons 200 tanpa field text dianggap rusak, bukan sukses", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    const { error } = await settle(suggestHabitsFromNarrative("x"));
    expect(error).toBeInstanceOf(Error);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("memotong narasi yang sangat panjang agar muat di batas prompt server", async () => {
    fetchMock.mockResolvedValueOnce(ok(HABITS));
    await settle(suggestHabitsFromNarrative("a".repeat(50000)));
    const { prompt } = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(prompt.length).toBeLessThan(8000);
  });
});
