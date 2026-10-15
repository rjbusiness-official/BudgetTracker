import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";
const source = await readFile(new URL("../src/data/demoData.ts", import.meta.url), "utf8");
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { createDemoBudgetState, resetOutdatedBudget, budgetDataRevision } = context.exports;
test("old local and cloud budgets reset all financial records", () => {
 const stale = createDemoBudgetState();
 delete stale.dataRevision;
 for (const key of ["incomes", "expenses", "bills", "debts", "debtPayments", "salaryAllocations", "salarySavingsRecords", "savingsGoals", "savingsTransactions", "wishlistItems", "vacationPlans", "familyShares", "budgetCategories", "dailyBudgets", "recurringTransactions"]) stale[key] = [{ id: "old" }];
 const reset = resetOutdatedBudget(stale);
 assert.equal(reset.dataRevision, budgetDataRevision);
 for (const [key, value] of Object.entries(reset)) if (Array.isArray(value) && !["users", "cutoffs"].includes(key)) assert.equal(value.length, 0, key);
});
test("records entered after the reset survive subsequent loads", () => {
 const fresh = createDemoBudgetState();
 fresh.incomes.push({ id: "new-income", amount: 1000 });
 assert.equal(resetOutdatedBudget(fresh), fresh);
 assert.equal(resetOutdatedBudget(fresh).incomes.length, 1);
});
