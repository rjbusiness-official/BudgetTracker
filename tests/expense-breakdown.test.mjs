import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/utils/expenseBreakdown.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { expenseBreakdown, orderedExpenseSegments } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
test("one row per category stacks each owner's spending and sorts by combined total", () => {
  const rows = expenseBreakdown([
    { category: "Food", paidBy: "Ruru", amount: 100 },
    { category: "Food", paidBy: "Joselle", amount: 200 },
    { category: "Food", paidBy: "Ruru", amount: 50 },
    { category: "Travel", paidBy: "Joselle", amount: 400 },
    { category: "Food", paidBy: "Shared Money", amount: 25 }
  ]);
  assert.deepEqual(rows, [
    { name: "Travel", value: 400, ruru: 0, joselle: 400, shared: 0 },
    { name: "Food", value: 375, ruru: 150, joselle: 200, shared: 25 }
  ]);
  for (const row of rows) assert.equal(row.value, row.ruru + row.joselle + row.shared);
});
test("empty expenses and unnamed categories are handled", () => {
  assert.deepEqual(expenseBreakdown([]), []);
  assert.equal(expenseBreakdown([{ category: "", paidBy: "Ruru", amount: 10 }])[0].name, "Uncategorized");
});

test("each bar orders amounts independently and keeps owner colors", () => {
  const transpo = orderedExpenseSegments({ ruru: 86, joselle: 200, shared: 0 }).filter(item => item.amount > 0);
  assert.deepEqual(transpo.map(item => item.owner), ["Ruru", "Joselle"]);
  assert.equal(transpo[0].color, "#249fff");
  const loan = orderedExpenseSegments({ ruru: 15000, joselle: 5000, shared: 0 }).filter(item => item.amount > 0);
  assert.deepEqual(loan.map(item => item.owner), ["Joselle", "Ruru"]);
  assert.equal(loan[0].color, "#c28afb");
  assert.equal(loan.reduce((sum, item) => sum + item.amount, 0), 20000);
});
