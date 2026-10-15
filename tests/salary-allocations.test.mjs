import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/utils/finance.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { walletBalance, salaryAllocationSummary, buildTransactions, applyDebtPayment } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
const fresh = () => ({ incomes: [{id:"salary",source:"Salary",type:"Salary",person:"Husband",paymentMethod:"Cash",amount:10000,date:"2026-10-15",cutoffId:"current"}], salaryAllocations: [], expenses: [], debts: [{id:"debt",name:"Card",remainingBalance:5000}], debtPayments: [], savingsTransactions: [], savingsGoals: [], salarySavingsRecords: [] });
const allocate = (state, category, amount) => state.salaryAllocations.push({id:category,incomeId:"salary",category,amount});
test("salary allocations automatically deduct from the matching wallet", () => {
 const state = fresh();
 allocate(state,"bill:Electricity",2000); allocate(state,"Family Share",500); allocate(state,"wish:New Phone",1000); allocate(state,"Pocket Money",500);
 assert.equal(walletBalance(state,"Ruru","Cash"),6000);
 assert.equal(walletBalance(state,"Joselle","Cash"),0);
 assert.equal(walletBalance(state,"Ruru","GCash"),0);
 assert.deepEqual(salaryAllocationSummary(state,"salary"),{allocated:4000,remaining:6000});
});
test("debt and savings deductions are counted once alongside allocations", () => {
 let state = fresh();
 allocate(state,"bill:Electricity",2000); allocate(state,"Family Share",500); allocate(state,"wish:New Phone",1000); allocate(state,"Pocket Money",500); allocate(state,"Savings",1500);
 state = applyDebtPayment(state,{id:"payment",incomeId:"salary",debtId:"debt",amount:1000,date:"2026-10-15",person:"Ruru",paymentMethod:"Cash",paymentSource:"Salary - Ruru",cutoffId:"current"});
 state.savingsTransactions.push({id:"saving",person:"Ruru",paymentMethod:"Cash",type:"Contribution",amount:1500,date:"2026-10-15"});
 assert.equal(walletBalance(state,"Ruru","Cash"),3500);
 assert.equal(state.debts[0].remainingBalance,4000);
 assert.deepEqual(salaryAllocationSummary(state,"salary"),{allocated:6500,remaining:3500});
 const tx = buildTransactions(state);
 assert.equal(tx.filter(t=>t.type==="Salary Allocation").length,4);
 assert.equal(tx.filter(t=>t.type==="Savings Contribution").length,1);
 assert.equal(tx.filter(t=>t.type==="Debt Payment").length,1);
 assert.equal(tx.filter(t=>t.type!=="Income").reduce((n,t)=>n+t.amount,0),6500);
 assert.equal(walletBalance(JSON.parse(JSON.stringify(state)),"Ruru","Cash"),3500);
});
test("allocation activity has the salary date, owner, category, and cutoff", () => {
 const state=fresh(); allocate(state,"bill:Internet",1200);
 const tx=buildTransactions(state).find(t=>t.type==="Salary Allocation");
 assert.equal(tx.description,"Internet allocation"); assert.equal(tx.person,"Ruru"); assert.equal(tx.date,"2026-10-15"); assert.equal(tx.cutoffId,"current");
});
