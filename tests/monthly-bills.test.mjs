import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";
const source = await readFile(new URL("../src/utils/monthlyBills.ts", import.meta.url), "utf8");
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { monthlyBillCategories, normalizeBillCategories } = context.exports;
const list = value => Array.from(value);
test("new budgets have the four default monthly categories", () => {
 assert.deepEqual(list(monthlyBillCategories({ bills: [] })), ["Electricity", "Water", "Internet", "Entertainment"]);
});
test("saved category additions and removals survive serialization", () => {
 const state = JSON.parse(JSON.stringify({ bills: [{name:"Old bill"}], monthlyBillCategories:["Electricity", "Rent"] }));
 assert.deepEqual(list(monthlyBillCategories(state)), ["Electricity", "Rent"]);
 assert.deepEqual(list(monthlyBillCategories({...state, monthlyBillCategories:[]})), []);
});
test("category names trim whitespace and reject case-insensitive duplicates", () => {
 assert.deepEqual(list(normalizeBillCategories([" Rent ", "rent", "", "  ", "Water"])), ["Rent", "Water"]);
});
test("legacy bill names remain available until the list is customized", () => {
 assert.deepEqual(list(monthlyBillCategories({bills:[{name:"Rent"},{name:"electricity"}]})), ["Electricity", "Water", "Internet", "Entertainment", "Rent"]);
});
