import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";
const context = { exports: {} };
const source = await readFile(new URL("../src/utils/incomeBreakdown.ts", import.meta.url), "utf8");
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { incomeBreakdown } = context.exports;
test("monthly income sources count linked repayments once and exclude other months", () => {
  const state = { incomes: [
    { id: "salary", type: "Salary", amount: 700, date: "2026-11-15" },
    { id: "extra", type: "Other", amount: 200, date: "2026-11-16" },
    { id: "linked", type: "Other", amount: 50, date: "2026-11-16" },
    { id: "old", type: "Salary", amount: 999, date: "2026-10-15" }
  ], receivablePayments: [
    { incomeId: "linked", amount: 50, date: "2026-11-16" },
    { amount: 50, date: "2026-11-17" },
    { amount: 999, date: "2026-10-17" }
  ] };
  const result = incomeBreakdown(state, "2026-11");
  assert.equal(result.total, 1000);
  assert.equal(result.shares[0].percentage, 70);
  assert.equal(result.shares[1].percentage, 20);
  assert.equal(result.shares[2].percentage, 10);
});
test("empty months yield zero percentages without invalid numbers", () => {
  const result = incomeBreakdown({ incomes: [] }, "2026-11");
  assert.equal(result.total, 0);
  assert.ok(result.shares.every(item => item.percentage === 0));
});
