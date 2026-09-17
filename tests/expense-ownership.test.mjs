import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/utils/finance.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { incomePersonForExpense, expensesForSalaryPeriod } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

test("expenses deduct only from their selected owner within the salary period", () => {
  const state = { expenses: [
    { paidBy: "Ruru", date: "2026-09-01", amount: 100 },
    { paidBy: "Joselle", date: "2026-09-01", amount: 200 },
    { paidBy: "Shared Money", date: "2026-09-01", amount: 300 },
    { paidBy: "Ruru", date: "2026-08-31", amount: 400 },
    { paidBy: "Ruru", date: "2026-09-15", amount: 500 }
  ] };
  for (const [owner, person, amount] of [["Ruru", "Husband", 100], ["Joselle", "Wife", 200], ["Shared Money", "Shared", 300]]) {
    assert.equal(incomePersonForExpense(owner), person);
    assert.equal(expensesForSalaryPeriod(state, { person, date: "2026-09-01" }, { date: "2026-09-15" }).reduce((sum, expense) => sum + expense.amount, 0), amount);
  }
  assert.equal(expensesForSalaryPeriod(state, { person: "Husband", date: "2026-09-15" }, undefined)[0].amount, 500);
});

test("changing ownership or deleting an expense updates the matching balances", () => {
  const expense = { paidBy: "Ruru", date: "2026-09-02", amount: 100 };
  const state = { expenses: [expense] };
  const husband = { person: "Husband", date: "2026-09-01" };
  const wife = { person: "Wife", date: "2026-09-01" };
  assert.equal(expensesForSalaryPeriod(state, husband, undefined).length, 1);
  expense.paidBy = "Joselle";
  assert.equal(expensesForSalaryPeriod(state, husband, undefined).length, 0);
  assert.equal(expensesForSalaryPeriod(state, wife, undefined).length, 1);
  state.expenses = [];
  assert.equal(expensesForSalaryPeriod(state, wife, undefined).length, 0);
});
