import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/utils/finance.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { walletBalance, totalSavings, availableSavings, buildTransactions, payBill } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
const fresh = () => ({ incomes: [], expenses: [], savingsTransactions: [], savingsGoals: [], salarySavingsRecords: [], debtPayments: [] });
test("cash and digital accounts stay separate for each person", () => {
 const s = fresh();
 s.incomes = [{ person: "Husband", paymentMethod: "GCash", amount: 1000 }, { person: "Wife", paymentMethod: "Cash", amount: 300 }, { person: "Husband", amount: 900 }];
 s.expenses = [{ paidBy: "Ruru", paymentMethod: "GCash", amount: 120, billId: "bill" }];
 assert.equal(walletBalance(s, "Ruru", "GCash"), 880);
 assert.equal(walletBalance(s, "Ruru", "Cash"), 0);
 assert.equal(walletBalance(s, "Joselle", "Cash"), 300);
 assert.equal(walletBalance(s, "Joselle", "GCash"), 0);
});
test("saving then transferring to the other person preserves money without income", () => {
 const s = fresh(); s.incomes = [{ id: "income", date: "2026-09-23", person: "Husband", paymentMethod: "BDO", amount: 1000 }];
 s.savingsTransactions.push({ id: "save", person: "Ruru", paymentMethod: "BDO", type: "Contribution", amount: 400, date: "2026-09-23" });
 s.savingsTransactions.push({ id: "transfer", person: "Joselle", paymentMethod: "GoTyme", type: "Withdrawal", amount: 150, date: "2026-09-23" });
 const restored = JSON.parse(JSON.stringify(s));
 assert.equal(walletBalance(restored, "Ruru", "BDO"), 600);
 assert.equal(walletBalance(restored, "Joselle", "GoTyme"), 150);
 assert.equal(totalSavings(restored), 250);
 assert.equal(restored.incomes.length, 1);
 assert.equal(buildTransactions(restored).find(t => t.id === "tx-transfer").person, "Joselle · GoTyme");
});
test("general savings cannot withdraw money allocated to a goal", () => {
 const s = fresh(); s.savingsGoals = [{ id: "goal", currentSavings: 500 }];
 s.savingsTransactions = [{ type: "Contribution", amount: 100 }];
 assert.equal(availableSavings(s), 100);
 assert.equal(availableSavings(s, "goal"), 500);
 assert.equal(availableSavings(s, "missing"), 0);
});

test("monthly bill pays once from the selected wallet and schedules next month", () => {
 const s = fresh(); s.cutoffs = []; s.bills = [{ id: "bill", name: "Internet", amount: 100, paidBy: "Joselle", paymentMethod: "Maya", dueDate: "2026-01-31", frequency: "Monthly", status: "Pending" }];
 const paid = payBill(s, "bill", "2026-01-30");
 assert.equal(paid.expenses.length, 1);
 assert.equal(paid.expenses[0].date, "2026-01-30");
 assert.equal(walletBalance(paid, "Joselle", "Maya"), -100);
 assert.equal(walletBalance(paid, "Ruru", "Maya"), 0);
 assert.equal(paid.bills[0].dueDate, "2026-02-28");
 assert.equal(paid.bills[0].status, "Pending");
 assert.equal(payBill(paid, "bill", "2026-01-30"), paid);
});
test("legacy bill needs a payment source before money can leave", () => {
 const s = fresh(); s.bills = [{ id: "legacy", status: "Pending" }];
 assert.equal(payBill(s, "legacy", "2026-09-23"), s);
});
