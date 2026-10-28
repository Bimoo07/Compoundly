import { describe, it, expect } from "vitest";
import { EVAL_SET } from "./crisisEvalSet.js";
import { checkForCrisisSignal } from "./guardrails.js";

// Uji REGRESI, bukan klaim kinerja: set dev dipakai merancang leksikon, jadi
// 100% di sini hanya berarti perubahan aturan tidak merusak perilaku yang
// sudah disepakati. Angka holdout dilaporkan lewat `node scripts/evalGuardrail.mjs`.
const dev = EVAL_SET.filter((r) => r.split === "dev");

describe("regresi guardrail pada set dev", () => {
  it("tidak ada false negative", () => {
    const missed = dev.filter((r) => r.label === 1 && !checkForCrisisSignal(r.text).flagged);
    expect(missed.map((r) => r.text)).toEqual([]);
  });
  it("tidak ada false positive", () => {
    const fp = dev.filter((r) => r.label === 0 && checkForCrisisSignal(r.text).flagged);
    expect(fp.map((r) => r.text)).toEqual([]);
  });
  it("kasus kebijakan ditandai sesuai kebijakan", () => {
    const miss = dev.filter((r) => r.label === "policy" && !checkForCrisisSignal(r.text).flagged);
    expect(miss.map((r) => r.text)).toEqual([]);
  });
});
