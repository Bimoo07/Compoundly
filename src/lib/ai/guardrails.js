/**
 * Crisis guardrail (v2).
 *
 * WAJIB dipanggil sebelum SEMUA teks buatan pengguna (narasi masa depan,
 * jurnal, tag, catatan setback) dikirim ke Gemini. Bila terdeteksi, panggilan
 * AI dilewati sepenuhnya dan aplikasi menampilkan pesan suportif non-AI
 * beserta sumber bantuan nyata.
 *
 * Sengaja berupa pencocokan pola deterministik, bukan model: tidak bisa gagal
 * karena jaringan dan berjalan sebelum batas AI disentuh.
 *
 * KEBIJAKAN (penting untuk laporan penelitian):
 *  1. Cakupan = ungkapan niat/ide bunuh diri dan niat menyakiti diri yang
 *     eksplisit (Indonesia + Inggris, termasuk campuran dan gaya ketik
 *     informal). BUKAN deteksi depresi, keputusasaan umum, atau kelelahan
 *     emosional ("capek banget", "gak kuat lagi" TIDAK ditandai).
 *  2. Condong ke over-flagging. Kalimat dengan negasi ("aku tidak ingin
 *     bunuh diri"), riwayat masa lalu, dan pembicaraan akademik tentang topik
 *     ini SENGAJA tetap ditandai, karena menekan negasi lewat aturan sederhana
 *     lebih berbahaya (false negative) daripada pesan dukungan yang tak perlu.
 *  3. Normalisasi: huruf kecil, buang aksen, leetspeak ("m4t1"), huruf
 *     berulang ("matiii"), tanda baca. Sejumlah idiom jinak dinetralkan
 *     ("cut myself some slack", "hp mau mati", "mati lampu").
 *  4. Ini lini pertahanan pertama, BUKAN pengganti intervensi krisis
 *     profesional. Sensitivitas/spesifisitas diukur dengan
 *     `node scripts/evalGuardrail.mjs` (lihat crisisEvalSet.js).
 *
 * Daftar frasa harus ditinjau bersama tenaga kesehatan jiwa sebelum dipakai
 * pada peserta sungguhan.
 */

export const GUARDRAIL_VERSION = "2.0.0";

// ---------------------------------------------------------------- normalisasi

const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s" };

const squash = (s) => s.replace(/([a-z])\1+/g, "$1");

/**
 * Teks pengguna dan frasa aturan melewati normalisasi yang SAMA, jadi
 * "kill" -> "kil", "matiii" -> "mati", "nggak" -> "ngak" di kedua sisi.
 */
export function normalizeForMatching(text) {
  return squash(
    String(text)
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "") // buang aksen
      .toLowerCase()
      .replace(/(?<=[a-z])[01345]|[01345](?=[a-z])/g, (d) => LEET[d])
      .replace(/(?<=[a-z])-(?=[a-z])/g, "") // self-harm -> selfharm; mati-matian -> matimatian
      .replace(/['’‘`´]/g, "") // don't -> dont
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

// ------------------------------------------------------------------ kompilasi

// Sintaks frasa: kata dipisah spasi; `*` = 0-2 kata sembarang; `kata~` = boleh
// diikuti akhiran huruf; `{nama}` = salah satu nilai di SETS.
const SETS = {
  neg: ["tidak", "gak", "ga", "nggak", "enggak", "tak", "ngga", "gk", "ngak"],
  want: ["ingin", "pengen", "pengin", "pingin", "pgn", "mau"],
  i: ["aku", "saya", "gue", "gw", "gua"],
  aja: ["aja", "saja", "aj"],
  device: [
    "hp", "hape", "handphone", "ponsel", "laptop", "baterai", "batre", "charger",
    "komputer", "pc", "tablet", "ipad", "mesin", "motor", "mobil", "wifi", "lampu", "listrik",
  ],
  state: ["udah", "sudah", "uda", "dah", "hampir", "lagi"],
};

function expand(phrase) {
  const m = phrase.match(/\{(\w+)\}/);
  if (!m) return [phrase];
  return SETS[m[1]].flatMap((v) => expand(phrase.replace(m[0], v)));
}

function compile(phrase) {
  const tokens = squash(phrase).split(" ");
  let src = "\\b";
  tokens.forEach((tok, i) => {
    if (tok === "*") {
      src += "(?:[a-z]+\\s+){0,2}";
      return;
    }
    const open = tok.endsWith("~");
    const word = open ? tok.slice(0, -1) : tok;
    if (!/^[a-z0-9]+$/.test(word)) throw new Error(`Frasa guardrail tidak valid: "${phrase}"`);
    src += word + (open ? "[a-z]*" : "");
    if (i < tokens.length - 1) src += "\\s+";
  });
  return new RegExp(`${src}\\b`);
}

const build = (phrases, locale) =>
  phrases.flatMap(expand).map((phrase) => ({ phrase, locale, re: compile(phrase) }));

// ---------------------------------------------------------------------- aturan

const ID_PHRASES = [
  // ide / niat bunuh diri
  "bunuh diri", "membunuh diri", "bundir", "gantung diri",
  "mengakhiri hidup~", "akhiri hidup~", "ngakhirin hidup~", "ngakhiri hidup~",
  "mengakhiri nyawa~", "akhiri nyawa~", "ngakhirin nyawa~", "menghabisi nyawa~", "ngabisin nyawa~",
  "{want} * mati", "lebih baik * mati", "mending * mati", "{i} mati {aja}",
  "{neg} {want} hidup lagi", "{neg} ada gunanya hidup", "{neg} ada alasan * hidup",
  "{neg} layak hidup", "{neg} pantas hidup",
  "tidur selamanya", "{want} menghilang selamanya", "{want} hilang selamanya",
  "lebih baik tanpa aku", "lebih baik {i} {neg} ada",
  // niat menyakiti diri
  "menyakiti diri sendiri", "menyakiti diriku", "melukai diri sendiri", "melukai diriku",
  "nyakitin diri sendiri", "nyakitin diriku",
  "menyayat tangan", "nyayat tangan", "menyayat nadi", "nyayat nadi",
  "self harm", "selfharm",
];

const EN_PHRASES = [
  "suicid~", "unaliv~",
  "kill~ myself", "kill~ my self",
  "end~ my life", "end~ my own life", "tak~ my life", "tak~ my own life", "end it all",
  "want~ to die", "wanna die", "wish i * dead", "wish i * never born",
  "better off dead", "better off without me",
  "dont want to live anymore", "dont wanna live anymore", "do not want to live anymore",
  "no longer want to live", "dont want to be alive", "dont wanna be alive",
  "dont want to be here anymore", "dont wanna be here anymore",
  "no reason to live", "no reason for living", "nothing to live for",
  "no point in living", "no point living", "not worth living", "life isnt worth living",
  "hurt~ myself", "harm~ myself", "cut~ myself", "cut~ my wrists", "slit~ my wrists", "hang myself",
  "self harm", "selfharm", "self injur~", "selfinjur~",
];

// Idiom/konteks jinak yang dihapus dari teks SEBELUM pencocokan.
const NEUTRAL_PHRASES = [
  "cut~ myself some slack", "cut~ myself a break", "kill~ myself laughing",
  "mati lampu", "mati listrik", "mati gaya", "mati sinyal", "mati mesin",
  // "hp mau mati", "baterai laptop mau mati", "hpku udah mau mati". Sengaja
  // sempit (tanpa jarak bebas) agar "laptop error, aku pengen mati" TIDAK ternetral.
  "{device}~ {want} mati", "{device}~ {device}~ {want} mati",
  "{device}~ ku {want} mati", "{device}~ nya {want} mati",
  "{device}~ {state} {want} mati", "{device}~ ku {state} {want} mati", "{device}~ nya {state} {want} mati",
];

const ID_RULES = build(ID_PHRASES, "id");
const EN_RULES = build(EN_PHRASES, "en");
const NEUTRAL_RES = NEUTRAL_PHRASES.flatMap(expand).map((p) => new RegExp(compile(p).source, "g"));

// Kata fungsi bahasa Indonesia, untuk memilih bahasa pesan pada teks campuran.
const ID_WORDS = new Set(
  [
    "aku", "saya", "gue", "gw", "yang", "dan", "tidak", "gak", "ga", "nggak", "banget", "aja",
    "udah", "sudah", "tapi", "untuk", "dengan", "ini", "itu", "lagi", "karena", "kalau", "jadi",
    "sama", "dari", "bisa", "rasanya", "kadang", "pengen", "ingin", "mau",
  ].map(squash),
);

function looksIndonesian(normalized) {
  const seen = new Set(normalized.split(" ").filter((w) => ID_WORDS.has(w)));
  return seen.size >= 2;
}

// ------------------------------------------------------------------------ API

/**
 * @param {unknown} text
 * @returns {{ flagged: false } | { flagged: true, locale: 'id' | 'en', rule: string }}
 *   `rule` = entri leksikon yang cocok (BUKAN teks pengguna), aman dicatat.
 */
export function checkForCrisisSignal(text) {
  if (!text || typeof text !== "string") return { flagged: false };
  let normalized = normalizeForMatching(text);
  if (!normalized) return { flagged: false };
  for (const re of NEUTRAL_RES) normalized = normalized.replace(re, " ");

  for (const rule of [...ID_RULES, ...EN_RULES]) {
    if (rule.re.test(normalized)) {
      const locale =
        rule.locale === "id" || looksIndonesian(normalized) ? "id" : "en";
      return { flagged: true, locale, rule: rule.phrase };
    }
  }
  return { flagged: false };
}

/**
 * Respons suportif non-AI yang ditampilkan menggantikan keluaran Gemini.
 * Sumber bantuan bersifat konservatif — verifikasi ulang berkala karena
 * detail layanan bisa berubah (terakhir diperiksa: Okt 2026, sumber Kemenkes RI).
 *
 * @param {'en' | 'id'} locale
 */
export function getCrisisResponse(locale = "en") {
  const copy = {
    id: {
      message:
        "Sepertinya kamu sedang menghadapi momen yang sangat berat. Compoundly bukan layanan krisis, tapi kamu tidak harus melalui ini sendirian. Jika kamu merasa tidak aman saat ini, segera datang ke IGD atau fasilitas kesehatan terdekat, atau minta seseorang yang kamu percaya untuk menemanimu.",
      resourceLabel:
        "Healing119.id — layanan kesehatan jiwa Kemenkes RI, gratis & 24 jam",
      resourceContact:
        "Telepon 119 ext. 8, atau chat WhatsApp lewat healing119.id. Jika belum tersambung, layanan mungkin sedang antre — coba lagi beberapa saat.",
    },
    en: {
      message:
        "It sounds like you're going through something really difficult right now. Compoundly isn't a crisis service, but you don't have to face this alone. If you might act on these thoughts right now, please contact your local emergency services or go to the nearest emergency room, or ask someone you trust to stay with you.",
      resourceLabel:
        "Find A Helpline — free, confidential support directory by country",
      resourceContact: "findahelpline.com",
    },
  };

  return copy[locale] ?? copy.en;
}
