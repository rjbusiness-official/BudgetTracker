import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

async function load(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const context = { exports: {}, Intl, Date, Math, Number };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const { allocateDebtBudget, projectDebtPayoff, buildDebtAmortization } = await load("../src/utils/debtPlan.ts");
const { applyDebtPayment, walletBalance } = await load("../src/utils/finance.ts");
const debt = (id, balance, minimum, rate = 0) => ({ id, remainingBalance: balance, minimumPayment: minimum, interestRate: rate, dueDate: "2026-10-20" });

test("strategies cover all minimums and prioritize extra payments correctly", () => {
  const debts = [debt("small", 200, 20, 0), debt("high-rate", 1000, 50, 36)];
  const avalanche = allocateDebtBudget(debts, { monthlyBudget: 170, strategy: "avalanche" });
  assert.equal(avalanche.allocations[0].debt.id, "high-rate");
  assert.equal(avalanche.allocations[0].payment, 150);
  assert.equal(avalanche.allocations[1].payment, 20);
  const snowball = allocateDebtBudget(debts, { monthlyBudget: 170, strategy: "snowball" });
  assert.equal(snowball.allocations[0].debt.id, "small");
  assert.equal(snowball.allocations[0].payment, 120);
});
test("shortfall, final payoff caps, and surplus are explicit", () => {
  const debts = [debt("one", 40, 100), debt("two", 100, 50)];
  assert.equal(allocateDebtBudget(debts, { monthlyBudget: 80, strategy: "snowball" }).shortfall, 10);
  const funded = allocateDebtBudget(debts, { monthlyBudget: 200, strategy: "snowball" });
  assert.equal(funded.unused, 60);
  assert.equal(funded.allocations.reduce((sum, item) => sum + item.payment, 0), 140);
});
test("projection rolls freed payments to remaining debts", () => {
  const plan = projectDebtPayoff([debt("one", 50, 20), debt("two", 150, 20)], { monthlyBudget: 100, strategy: "snowball" });
  assert.equal(plan.months, 2);
  assert.equal(plan.interest, 0);
  assert.equal(plan.schedule[1].balance, 0);
});
test("monthly and annual interest produce equivalent amortization", () => {
  const settings = { monthlyBudget: 103, strategy: "avalanche" };
  const annual = projectDebtPayoff([debt("card", 100, 10, 36)], settings);
  const monthly = projectDebtPayoff([{ ...debt("card", 100, 10, 3), interestRatePeriod: "Monthly" }], settings);
  assert.equal(annual.months, 1);
  assert.equal(annual.interest, 3);
  assert.equal(monthly.interest, annual.interest);
});
test("insufficient and non-amortizing payments do not claim a payoff date", () => {
  assert.equal(projectDebtPayoff([debt("one", 100, 20)], { monthlyBudget: 10, strategy: "avalanche" }).months, null);
  assert.equal(projectDebtPayoff([debt("one", 100, 1, 120)], { monthlyBudget: 5, strategy: "avalanche" }).months, null);
  assert.equal(projectDebtPayoff([], { monthlyBudget: 0, strategy: "snowball" }).months, 0);
});
test("recorded payment reduces debt and wallet exactly once", () => {
  const state = { debts: [debt("card", 500, 50)], debtPayments: [], expenses: [], savingsTransactions: [], incomes: [{ person: "Husband", paymentMethod: "Cash", amount: 300 }] };
  const payment = { id: "pay", debtId: "card", amount: 100, date: "2026-10-15", person: "Ruru", paymentMethod: "Cash" };
  const next = applyDebtPayment(state, payment);
  assert.equal(next.debts[0].remainingBalance, 400);
  assert.equal(walletBalance(next, "Ruru", "Cash"), 200);
  assert.equal(next.expenses.length, 0);
  assert.equal(applyDebtPayment(next, payment), next);
  for (const amount of [-1, 0, NaN, 301, 501]) assert.equal(applyDebtPayment(state, { ...payment, amount }), state);
  assert.equal(applyDebtPayment(state, { ...payment, debtId: "missing" }), state);
});

test("45000 at 1800 shows 25 installments due on the 15th", () => {
  const plan = buildDebtAmortization({ ...debt("bdo", 45000, 1800), plannedPayment: 1800, dueDate: "2026-10-15" });
  assert.equal(plan.reason, "");
  assert.equal(plan.rows.length, 25);
  assert.equal(plan.rows[0].dueDate, "2026-10-15");
  assert.equal(plan.rows[0].remainingBalance, 43200);
  assert.equal(plan.rows[1].dueDate, "2026-11-15");
  assert.equal(plan.rows[24].dueDate, "2028-10-15");
  assert.equal(plan.rows[24].remainingBalance, 0);
  assert.equal(plan.totalPayments, 45000);
});
test("amortization caps the last payment and restores the due day after February", () => {
  const plan = buildDebtAmortization({ ...debt("one", 250, 100), plannedPayment: 100, dueDate: "2027-01-31" });
  assert.equal(plan.rows[1].dueDate, "2027-02-28");
  assert.equal(plan.rows[2].dueDate, "2027-03-31");
  assert.equal(plan.rows[2].payment, 50);
});
test("amortization splits interest and principal and rejects inadequate payments", () => {
  const card = { ...debt("one", 1000, 100, 3), plannedPayment: 100, interestRatePeriod: "Monthly", dueDate: "2026-10-15" };
  const plan = buildDebtAmortization(card);
  assert.equal(plan.rows[0].interest, 30);
  assert.equal(plan.rows[0].principal, 70);
  assert.equal(plan.rows[0].remainingBalance, 930);
  assert.equal(plan.rows.at(-1).remainingBalance, 0);
  assert.ok(buildDebtAmortization({ ...card, plannedPayment: 30 }).reason);
  assert.ok(buildDebtAmortization({ ...card, plannedPayment: 0, minimumPayment: 0 }).reason);
});
test("recorded balance snapshots persist and forecasts recalculate from the remaining debt", () => {
  const state = { debts: [{ ...debt("card", 45000, 1800), plannedPayment: 1800, dueDate: "2026-10-15" }], debtPayments: [], expenses: [], savingsTransactions: [], incomes: [{ person: "Husband", paymentMethod: "Cash", amount: 1800 }] };
  const next = applyDebtPayment(state, { id: "pay", debtId: "card", amount: 1800, date: "2026-10-15", person: "Ruru", paymentMethod: "Cash" });
  const restored = JSON.parse(JSON.stringify(next));
  assert.equal(restored.debtPayments[0].balanceAfterPayment, 43200);
  const plan = buildDebtAmortization(restored.debts[0], "2026-11-15");
  assert.equal(plan.rows.length, 24);
  assert.equal(plan.rows[0].openingBalance, 43200);
});
