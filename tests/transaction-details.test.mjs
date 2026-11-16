import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";
const source = await readFile(new URL("../src/utils/transactionDetails.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { transactionDetails } = context.exports;
const state = { expenses: [{ id: "one", name: "Grocer", notes: "Weekly food\nKeep receipt", paidBy: "Joselle", paymentMethod: "GCash", payeeName: "Shop" }], incomes: [{ id: "one", source: "Salary", person: "Husband", paymentMethod: "BDO", notes: "November" }], debtPayments: [{ id: "payment", debtId: "card", incomeId: "one", notes: "Extra payment" }], debts: [{ id: "card", name: "Card", creditor: "Bank" }], fundTransfers: [{ id: "transfer", person: "Ruru", fromMethod: "Cash", toMethod: "Maya", notes: "Top up" }] };
const tx = (id, type) => ({ id: "tx-" + id, type, description: "Record", person: "Shared Money" });
test("expense details preserve vendor, multiline comments, wallet, owner and recipient", () => {
  const result = transactionDetails(state, tx("one", "Expense"));
  assert.equal(result.vendor, "Grocer");
  assert.equal(result.comments, "Weekly food\nKeep receipt");
  assert.equal(result.person, "Joselle");
  assert.equal(result.wallet, "GCash");
  assert.equal(result.payee, "Shop");
});
test("income details use the receiving wallet and translate owner names", () => {
  const result = transactionDetails(state, tx("one", "Income"));
  assert.equal(result.person, "Ruru");
  assert.equal(result.destination, "BDO");
  assert.equal(result.wallet, "Not recorded");
  assert.equal(result.comments, "November");
});
test("salary debt payments resolve their linked account without confusing source text with owner", () => {
  const result = transactionDetails(state, tx("payment", "Debt Payment"));
  assert.equal(result.wallet, "BDO");
  assert.equal(result.person, "Ruru");
  assert.equal(result.payee, "Bank");
  assert.equal(result.comments, "Extra payment");
});
test("transfer details distinguish source from destination", () => {
  const result = transactionDetails(state, tx("transfer", "Fund Transfer"));
  assert.equal(result.wallet, "Cash");
  assert.equal(result.destination, "Maya");
});
test("missing historical fields are explicit and do not invent a wallet or owner", () => {
  const result = transactionDetails(state, tx("missing", "Expense"));
  assert.equal(result.person, "Not recorded");
  assert.equal(result.wallet, "Not recorded");
  assert.equal(result.comments, "No comments");
});
