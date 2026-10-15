import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/utils/finance.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { applyFundTransfer, fundTransferError, walletBalance, totalIncome, actualSpend, totalSavings, buildTransactions } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
const fresh = () => ({incomes:[{id:"income",person:"Husband",paymentMethod:"BDO",amount:1000,date:"2026-10-15",source:"Salary",type:"Salary"}],salaryAllocations:[],expenses:[],savingsTransactions:[],savingsGoals:[],salarySavingsRecords:[],debtPayments:[],debts:[]});
const transfer = overrides => ({id:"transfer",person:"Ruru",fromMethod:"BDO",toMethod:"Cash",amount:300,date:"2026-10-15",cutoffId:"current",...overrides});
test("BDO to Cash changes both balances and preserves financial totals", () => {
 const before=fresh(); const after=applyFundTransfer(before,transfer());
 assert.equal(walletBalance(after,"Ruru","BDO"),700); assert.equal(walletBalance(after,"Ruru","Cash"),300);
 assert.equal(walletBalance(after,"Joselle","Cash"),0);
 assert.equal(totalIncome(after.incomes),1000); assert.equal(actualSpend(after.expenses),0); assert.equal(totalSavings(after),0);
 const activity=buildTransactions(after).find(item=>item.type==="Fund Transfer"); assert.equal(activity.description,"BDO → Cash"); assert.equal(activity.amount,300);
 assert.equal(before.fundTransfers,undefined);
});
test("BDO to GCash transfers persist after reload", () => {
 const after=JSON.parse(JSON.stringify(applyFundTransfer(fresh(),transfer({toMethod:"GCash"}))));
 assert.equal(walletBalance(after,"Ruru","BDO"),700); assert.equal(walletBalance(after,"Ruru","GCash"),300);
});
test("same wallet, invalid amount, invalid date and insufficient funds are rejected", () => {
 const state=fresh();
 for (const override of [{toMethod:"BDO"},{amount:0},{amount:-5},{amount:NaN},{amount:1.001},{amount:1001},{date:""},{date:"invalid"},{person:"Shared"},{toMethod:"Unknown"}]) {
  const input=transfer(override); assert.ok(fundTransferError(state,input)); assert.equal(applyFundTransfer(state,input),state);
 }
});
test("allocations reduce the amount available for transfer", () => {
 const state=fresh();state.salaryAllocations=[{id:"allocation",incomeId:"income",category:"bill:Electricity",amount:800}];
 assert.equal(applyFundTransfer(state,transfer()),state);
 const after=applyFundTransfer(state,transfer({amount:200})); assert.equal(walletBalance(after,"Ruru","BDO"),0); assert.equal(walletBalance(after,"Ruru","Cash"),200);
});
test("duplicate transfers never deduct twice and destination funds can be transferred onward", () => {
 const first=applyFundTransfer(fresh(),transfer()); assert.equal(applyFundTransfer(first,transfer()),first);
 const after=applyFundTransfer(first,transfer({id:"second",fromMethod:"Cash",toMethod:"GCash",amount:100}));
 assert.equal(walletBalance(after,"Ruru","BDO"),700);assert.equal(walletBalance(after,"Ruru","Cash"),200);assert.equal(walletBalance(after,"Ruru","GCash"),100);
});
test("decimal currency and full-wallet transfers are supported", () => {
 const state=fresh();state.incomes[0].amount=10.10;
 const after=applyFundTransfer(state,transfer({amount:10.10}));assert.equal(walletBalance(after,"Ruru","BDO"),0);assert.equal(walletBalance(after,"Ruru","Cash"),10.10);
});
