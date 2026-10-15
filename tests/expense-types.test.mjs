import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/utils/expenseTypes.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { expenseTypes, normalizeExpenseTypes } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
test("existing budgets receive the original default expense types", () => {
 assert.deepEqual(expenseTypes({}), ["Food", "Transpo", "Gas", "Item", "others"]);
});
test("custom types and removals survive saving without changing old expenses", () => {
 const state = JSON.parse(JSON.stringify({expenseTypes:["Food", "Groceries"],expenses:[{category:"Gas",amount:100}]}));
 assert.deepEqual(expenseTypes(state), ["Food", "Groceries"]);
 assert.equal(state.expenses[0].category,"Gas");
 assert.deepEqual(expenseTypes({expenseTypes:[]}), []);
});
test("expense types trim names and reject blank or duplicate names", () => {
 assert.deepEqual(normalizeExpenseTypes([" Groceries ","groceries","", "  ","Food"]), ["Groceries", "Food"]);
});
