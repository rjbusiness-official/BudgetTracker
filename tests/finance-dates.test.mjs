import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/utils/finance.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { toDate, formatShortDate, formatLongDate, buildTransactions } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

test("date-only values retain local midnight and their display date", () => {
  assert.equal(toDate("2026-10-17").getHours(), 0);
  assert.equal(formatShortDate("2026-10-17"), "Oct 17");
  assert.equal(formatLongDate("2026-10-17"), "October 17, 2026");
});

test("datetime-local expenses render in dashboard recent activity", () => {
  const state = { incomes: [], expenses: [{ id: "expense", date: "2026-10-17T14:30", name: "Lunch", amount: 100, category: "Food", paidBy: "Ruru" }], debtPayments: [], savingsTransactions: [], salarySavingsRecords: [], salaryAllocations: [], fundTransfers: [] };
  const [transaction] = buildTransactions(state);
  assert.equal(formatShortDate(transaction.date), "Oct 17");
  assert.equal(formatLongDate(transaction.date), "October 17, 2026");
  assert.equal(toDate(transaction.date).getHours(), 14);
  assert.equal(formatShortDate("2026-10-17T00:00"), "Oct 17");
});

test("missing and malformed dates cannot crash date formatting", () => {
  for (const value of ["", "invalid", "2026-10-17T14:30T00:00:00", undefined, null]) {
    assert.equal(formatShortDate(value), "Invalid date");
    assert.equal(formatLongDate(value), "Invalid date");
  }
});
