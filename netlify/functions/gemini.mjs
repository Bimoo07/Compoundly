import { handleGeminiRequest } from "../lib/proxyCore.mjs";

// Satu-satunya tempat GEMINI_API_KEY dibaca. Set di Netlify:
// Site configuration → Environment variables (centang "Contains secret values").
export default async (req) => handleGeminiRequest(req, { env: process.env });

export const config = {
  path: "/api/gemini",
  method: "POST",
  // Per IP. Hati-hati: satu jaringan kampus/lab sering berbagi satu IP publik,
  // jadi batasnya sengaja longgar. Kalau mulai kena 429 saat sesi kelas,
  // naikkan windowLimit.
  rateLimit: {
    windowLimit: 120,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
