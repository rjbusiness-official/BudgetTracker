import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/utils/finance.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const {getWalletMethods,allWalletMethods,normalizeWalletMethods,applyFundTransfer,walletBalance} = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
const fresh = () => ({incomes:[],expenses:[],savingsTransactions:[],debtPayments:[],salaryAllocations:[]});
test("default accounts include banks, wallets and cash",()=>{
 const accounts=getWalletMethods(fresh());for(const name of ["BDO","Cash","GCash"])assert.ok(accounts.includes(name));
});
test("account additions, removal and empty lists survive saving",()=>{
 const state=JSON.parse(JSON.stringify({...fresh(),walletMethods:["BPI","Cash"]}));
 assert.deepEqual(getWalletMethods(state),["BPI","Cash"]);assert.deepEqual(getWalletMethods({...state,walletMethods:[]}),[]);
 assert.deepEqual(normalizeWalletMethods([" BPI ","bpi","", "Cash"]),["BPI","Cash"]);
});
test("custom bank funds can transfer to cash",()=>{
 const state={...fresh(),walletMethods:["BPI","Cash"],incomes:[{id:"salary",person:"Husband",paymentMethod:"BPI",amount:500}]};
 const after=applyFundTransfer(state,{id:"transfer",person:"Ruru",fromMethod:"BPI",toMethod:"Cash",amount:200,date:"2026-10-15",cutoffId:"current"});
 assert.equal(walletBalance(after,"Ruru","BPI"),300);assert.equal(walletBalance(after,"Ruru","Cash"),200);
});
test("dashboard retains historical account balances after removing an entry option",()=>{
 const state={...fresh(),walletMethods:["Cash"],incomes:[{id:"old",person:"Husband",paymentMethod:"Old Bank",amount:500}]};
 assert.deepEqual(getWalletMethods(state),["Cash"]);assert.deepEqual(allWalletMethods(state),["Cash","Old Bank"]);
 assert.equal(allWalletMethods(state).reduce((n,name)=>n+walletBalance(state,"Ruru",name),0),500);
});
