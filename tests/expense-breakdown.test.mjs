import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/utils/expenseBreakdown.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { expenseBreakdown } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
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
