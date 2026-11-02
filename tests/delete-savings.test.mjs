import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/utils/finance.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ESNext}}).outputText;
const {applySavingsDeletion, savingsDeletionError, walletBalance, totalSavings, applyFundTransfer, buildTransactions} = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
const goal = (id, amount) => ({id,name:id,owner:"Ruru",paymentMethod:"BDO",currentSavings:amount,contributionThisCutoff:0,targetAmount:0,targetDate:""});
const fresh = () => ({walletMethods:["BDO","Cash"], incomes:[{id:"income",person:"Husband",paymentMethod:"BDO",amount:1000,date:"2026-11-02"}],expenses:[],debts:[],debtPayments:[],salaryAllocations:[],salarySavingsRecords:[],savingsGoals:[goal("source",200),goal("target",50)],savingsTransactions:[{id:"old",goalId:"source",person:"Ruru",paymentMethod:"BDO",amount:200,date:"2026-11-02",type:"Contribution",recordOnly:true}],fundTransfers:[]});
const input = overrides => ({goalId:"source",balance:200,date:"2026-11-02",cutoffId:"current",...overrides});

test("zero savings deletes directly without changing wallets or losing history", () => {
 const state=fresh();state.savingsGoals[0].currentSavings=0;
 const after=applySavingsDeletion(state,input({balance:0}),"delete");
 assert.equal(after.savingsGoals.length,1);assert.equal(after.savingsTransactions.length,1);
 assert.equal(walletBalance(after,"Ruru","BDO"),1000);assert.equal(totalSavings(after),50);
 assert.equal(buildTransactions(after).find(tx=>tx.id==="tx-old").description,"source");
});
test("funded savings requires a valid destination and the reviewed balance", () => {
 const state=fresh();
 for(const override of [{},{balance:0},{balance:NaN},{date:""},{destination:{type:"savings",goalId:"source"}},{destination:{type:"savings",goalId:"missing"}},{destination:{type:"wallet",person:"Combined",paymentMethod:"Cash"}},{destination:{type:"wallet",person:"Ruru",paymentMethod:"missing"}},{destination:{type:"unknown"}}]) {
  const request=input(override);assert.ok(savingsDeletionError(state,request));assert.equal(applySavingsDeletion(state,request,"delete"),state);
 }
});
test("deleting into a wallet moves the full balance without creating income or reversing legacy deductions", () => {
 const state=fresh();state.savingsTransactions[0].recordOnly=false;
 const after=applySavingsDeletion(state,input({destination:{type:"wallet",person:"Joselle",paymentMethod:"Cash"}}),"delete");
 assert.equal(walletBalance(after,"Ruru","BDO"),800);assert.equal(walletBalance(after,"Joselle","Cash"),200);
 assert.equal(totalSavings(after),50);assert.equal(after.incomes,state.incomes);assert.equal(after.expenses,state.expenses);
 assert.equal(after.savingsTransactions.length,2);
 assert.equal(applySavingsDeletion(after,input({destination:{type:"wallet",person:"Joselle",paymentMethod:"Cash"}}),"delete"),after);
 const restored=JSON.parse(JSON.stringify(after));assert.equal(walletBalance(restored,"Joselle","Cash"),200);assert.equal(totalSavings(restored),50);
});
test("moving to another savings preserves total savings and both wallets", () => {
 const state=fresh();state.savingsGoals[1].owner="Combined";
 const after=applySavingsDeletion(state,input({destination:{type:"savings",goalId:"target"}}),"delete");
 assert.equal(after.savingsGoals[0].currentSavings,250);assert.equal(totalSavings(after),totalSavings(state));
 assert.equal(walletBalance(after,"Ruru","BDO"),1000);assert.equal(walletBalance(after,"Joselle","Cash"),0);
 assert.equal(after.savingsGoals[0].contributionThisCutoff,0);
 const restored=JSON.parse(JSON.stringify(after));assert.equal(totalSavings(restored),250);
});
test("wallet-funded savings retains the original transfer deduction after deletion", () => {
 const state=fresh();state.savingsGoals[0].currentSavings=0;state.savingsTransactions=[];
 const funded=applyFundTransfer(state,{id:"fund",person:"Ruru",fromMethod:"BDO",toMethod:"BDO",toGoalId:"source",amount:200,date:"2026-11-02",cutoffId:"current"});
 const after=applySavingsDeletion(funded,input({destination:{type:"wallet",person:"Ruru",paymentMethod:"BDO"}}),"delete");
 assert.equal(walletBalance(after,"Ruru","BDO"),1000);assert.equal(totalSavings(after),50);assert.equal(after.fundTransfers.length,1);
});
test("decimal balances move in full and negative balances cannot be deleted", () => {
 const state=fresh();state.savingsGoals[0].currentSavings=10.25;
 const after=applySavingsDeletion(state,input({balance:10.25,destination:{type:"savings",goalId:"target"}}),"delete");
 assert.equal(after.savingsGoals[0].currentSavings,60.25);
 state.savingsGoals[0].currentSavings=-1;assert.equal(applySavingsDeletion(state,input({balance:-1}),"delete"),state);
});
