import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source=await readFile(new URL("../src/utils/finance.ts",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {savingsForOwner,namedSavingsError,applyNamedSavings,walletBalance,totalSavings,buildTransactions}=await import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"));
const goal=(id,owner)=>({id,name:"Emergency",owner,paymentMethod:"BDO",targetAmount:0,targetDate:"",currentSavings:0,contributionThisCutoff:0});
const fresh=()=>({incomes:[{id:"income",person:"Husband",paymentMethod:"BDO",amount:1000,date:"2026-11-01"},{id:"wife",person:"Wife",paymentMethod:"BDO",amount:700,date:"2026-11-01"}],expenses:[],salaryAllocations:[],savingsGoals:[goal("ruru","Ruru"),goal("joselle","Joselle"),goal("combined","Combined")],savingsTransactions:[],salarySavingsRecords:[],debtPayments:[],debts:[]});
const contribution=overrides=>({id:"saving",goalId:"ruru",person:"Ruru",paymentMethod:"BDO",amount:200,date:"2026-11-01",cutoffId:"current",type:"Contribution",...overrides});
test("owner selection returns only that owner's named savings",()=>{
 const state=fresh();for(const [owner,id] of [["Ruru","ruru"],["Joselle","joselle"],["Combined","combined"]])assert.deepEqual(savingsForOwner(state,owner).map(g=>g.id),[id]);
 state.savingsGoals.push({id:"legacy",name:"Old savings"});assert.equal(savingsForOwner(state,"Ruru").length,1);
});
test("saving deducts the wallet and increases the named account exactly once",()=>{
 const state=fresh();const after=applyNamedSavings(state,contribution());
 assert.equal(walletBalance(after,"Ruru","BDO"),800);assert.equal(walletBalance(after,"Joselle","BDO"),700);
 assert.equal(after.savingsGoals[0].currentSavings,200);assert.equal(after.savingsGoals[0].contributionThisCutoff,200);assert.equal(totalSavings(after),200);
 assert.equal(applyNamedSavings(after,contribution()),after);
 const tx=buildTransactions(after).find(t=>t.type==="Savings Contribution");assert.equal(tx.description,"Emergency");assert.equal(tx.amount,200);
 const restored=JSON.parse(JSON.stringify(after));assert.equal(totalSavings(restored),200);assert.equal(restored.savingsGoals[0].paymentMethod,"BDO");
});
test("combined savings can receive contributions from both owners",()=>{
 const first=applyNamedSavings(fresh(),contribution({goalId:"combined"}));
 const after=applyNamedSavings(first,contribution({id:"second",goalId:"combined",person:"Joselle",amount:100}));
 assert.equal(after.savingsGoals[2].currentSavings,300);assert.equal(walletBalance(after,"Ruru","BDO"),800);assert.equal(walletBalance(after,"Joselle","BDO"),600);assert.equal(totalSavings(after),300);
});
test("invalid, mismatched, or unaffordable contributions leave balances unchanged",()=>{
 const state=fresh();for(const override of [{person:"Joselle"},{goalId:"missing"},{paymentMethod:"Cash"},{amount:0},{amount:-1},{amount:NaN},{amount:1.001},{amount:1001},{date:""},{type:"Withdrawal"}]){const tx=contribution(override);assert.ok(namedSavingsError(state,tx));assert.equal(applyNamedSavings(state,tx),state);}
});
