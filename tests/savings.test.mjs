import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/utils/finance.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { totalSavings, buildTransactions } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

test("savings records accumulate without a goal and survive serialization", () => {
  const state = { savingsGoals: [], savingsTransactions: [], salarySavingsRecords: [], incomes: [], expenses: [], debtPayments: [] };
  assert.equal(totalSavings(state), 0);
  state.savingsTransactions.push({ id: "one", amount: 100, type: "Contribution", date: "2026-09-19" });
  state.savingsTransactions.push({ id: "two", amount: 250, type: "Contribution", date: "2026-09-20" });
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(totalSavings(restored), 350);
  assert.equal(buildTransactions(restored).length, 2);
  assert.equal(buildTransactions(restored)[0].description, "Savings");
});

test("existing goal balances are preserved without double counting contributions", () => {
  const state = {
    savingsGoals: [{ id: "legacy", currentSavings: 500 }],
    savingsTransactions: [
      { goalId: "legacy", type: "Contribution", amount: 500 },
      { type: "Contribution", amount: 200 },
      { type: "Withdrawal", amount: 50 }
    ],
    salarySavingsRecords: [{ amount: 300 }]
  };
  assert.equal(totalSavings(state), 950);
});
