// Mengukur kinerja guardrail krisis pada set uji berlabel.
//   node scripts/evalGuardrail.mjs            -> tabel ringkas + daftar salah
//   node scripts/evalGuardrail.mjs --json     -> keluaran JSON (untuk lampiran/analisis)
import { EVAL_SET } from "../src/lib/ai/crisisEvalSet.js";
import { checkForCrisisSignal, GUARDRAIL_VERSION } from "../src/lib/ai/guardrails.js";

const asJson = process.argv.includes("--json");

/** Interval Wilson 95% untuk proporsi k/n. */
export function wilson(k, n, z = 1.96) {
  if (n === 0) return [null, null];
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

const pct = (x) => (x === null ? "n/a" : `${(x * 100).toFixed(1)}%`);
const ratio = (k, n) => {
  const [lo, hi] = wilson(k, n);
  return { k, n, value: n ? k / n : null, ci95: [lo, hi] };
};
const fmt = (r) => `${pct(r.value)} (${r.k}/${r.n}; 95% CI ${pct(r.ci95[0])}–${pct(r.ci95[1])})`;

function evaluate(items) {
  const results = items.map((it) => ({ ...it, flagged: checkForCrisisSignal(it.text).flagged }));
  const pos = results.filter((r) => r.label === 1);
  const neg = results.filter((r) => r.label === 0);
  const pol = results.filter((r) => r.label === "policy");
  const byCategory = {};
  for (const r of results) {
    const c = (byCategory[`${r.label}:${r.category}`] ??= { label: r.label, category: r.category, n: 0, flagged: 0 });
    c.n += 1;
    if (r.flagged) c.flagged += 1;
  }
  return {
    n: items.length,
    sensitivity: ratio(pos.filter((r) => r.flagged).length, pos.length),
    specificity: ratio(neg.filter((r) => !r.flagged).length, neg.length),
    falsePositiveRate: ratio(neg.filter((r) => r.flagged).length, neg.length),
    policyFlagged: ratio(pol.filter((r) => r.flagged).length, pol.length),
    byCategory: Object.values(byCategory),
    falseNegatives: pos.filter((r) => !r.flagged).map(({ id, category, text }) => ({ id, category, text })),
    falsePositives: neg.filter((r) => r.flagged).map(({ id, category, text }) => ({ id, category, text })),
    policyMissed: pol.filter((r) => !r.flagged).map(({ id, category, text }) => ({ id, category, text })),
  };
}

const splits = { dev: evaluate(EVAL_SET.filter((r) => r.split === "dev")), holdout: evaluate(EVAL_SET.filter((r) => r.split === "holdout")) };
splits.all = evaluate(EVAL_SET);

if (asJson) {
  console.log(JSON.stringify({ guardrailVersion: GUARDRAIL_VERSION, splits }, null, 2));
} else {
  console.log(`Guardrail ${GUARDRAIL_VERSION} — ${EVAL_SET.length} kalimat uji (sintetis, ditulis oleh pembuat aturan)\n`);
  console.log("| Split | n | Sensitivitas | Spesifisitas | False-positive rate | Policy ditandai |");
  console.log("|---|---|---|---|---|---|");
  for (const [name, s] of Object.entries(splits)) {
    console.log(`| ${name} | ${s.n} | ${fmt(s.sensitivity)} | ${fmt(s.specificity)} | ${fmt(s.falsePositiveRate)} | ${s.policyFlagged.k}/${s.policyFlagged.n} |`);
  }
  console.log("\nPer kategori (flagged/n):");
  for (const [name, s] of Object.entries(splits).filter(([k]) => k !== "all")) {
    console.log(`  [${name}] ` + s.byCategory.map((c) => `${c.label}:${c.category} ${c.flagged}/${c.n}`).join(" · "));
  }
  for (const name of ["dev", "holdout"]) {
    const s = splits[name];
    console.log(`\n[${name}] False negative (${s.falseNegatives.length}):`);
    s.falseNegatives.forEach((r) => console.log(`  - (${r.category}) ${r.text}`));
    console.log(`[${name}] False positive (${s.falsePositives.length}):`);
    s.falsePositives.forEach((r) => console.log(`  - (${r.category}) ${r.text}`));
    console.log(`[${name}] Policy tidak ditandai (${s.policyMissed.length}):`);
    s.policyMissed.forEach((r) => console.log(`  - (${r.category}) ${r.text}`));
  }
}
