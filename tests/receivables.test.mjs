import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/utils/finance.ts",import.meta.url),"utf8");
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {applyReceivable,applyReceivablePayment,receivableBalance,receivableError,receivablePaymentError,migrateLendingExpenses,normalizeImportedState,walletBalance,totalSavings,totalIncome,actualSpend,buildTransactions,allWalletMethods} = await import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"));
const fresh = () => ({profile:{},cutoffs:[],walletMethods:["Cash","BDO"],incomes:[{id:"income",person:"Husband",paymentMethod:"Cash",amount:1000,date:"2026-11-08"}],expenses:[],salaryAllocations:[],salarySavingsRecords:[],savingsTransactions:[],savingsGoals:[{id:"goal",name:"Emergency",owner:"Combined",currentSavings:500}],debtPayments:[],debts:[]});
const loan = overrides => ({id:"loan",borrowerName:"Alex",amount:300,person:"Ruru",paymentMethod:"Cash",date:"2026-11-08",cutoffId:"current",...overrides});
const payment = overrides => ({id:"payment",receivableId:"loan",amount:100,person:"Joselle",paymentMethod:"BDO",date:"2026-11-09",cutoffId:"current",...overrides});

test("wallet lending deducts once without expenses; partial and final payments conserve funds",()=>{
 const before=fresh();const lent=applyReceivable(before,loan());
 assert.equal(walletBalance(lent,"Ruru","Cash"),700);assert.equal(actualSpend(lent.expenses),0);
 assert.equal(applyReceivable(lent,loan()),lent);assert.equal(walletBalance(before,"Ruru","Cash"),1000);
 const partial=JSON.parse(JSON.stringify(applyReceivablePayment(lent,payment())));
 assert.equal(receivableBalance(partial,"loan"),200);assert.equal(walletBalance(partial,"Joselle","BDO"),100);
 assert.equal(totalIncome(partial.incomes),1000);assert.equal(applyReceivablePayment(partial,payment()),partial);
 const paid=applyReceivablePayment(partial,payment({id:"final",amount:200}));
 assert.equal(receivableBalance(paid,"loan"),0);assert.equal(walletBalance(paid,"Joselle","BDO"),300);
 assert.equal(buildTransactions(paid).filter(t=>t.type==="Receivable Repayment").length,2);
 assert.equal(applyReceivablePayment(paid,payment({id:"extra",amount:1})),paid);
});

test("savings lending reduces savings without crediting or debiting any wallet",()=>{
 const lent=applyReceivable(fresh(),loan({goalId:"goal",person:"Shared Money"}));
 assert.equal(totalSavings(lent),200);assert.equal(walletBalance(lent,"Ruru","Cash"),1000);
 assert.equal(lent.receivables[0].goalName,"Emergency");
 const paid=applyReceivablePayment(lent,payment({amount:300}));
 assert.equal(totalSavings(paid),200);assert.equal(walletBalance(paid,"Joselle","BDO"),300);
});

test("optional dates and invalid accounts, amounts, dates, overpayments are validated",()=>{
 const state=fresh();assert.equal(receivableError(state,loan()),"");assert.equal(receivableError(state,loan({dueDate:"2026-12-01"})),"");
 for(const overrides of [{borrowerName:" "},{amount:0},{amount:NaN},{amount:1.001},{amount:1001},{goalId:"missing"},{goalId:"goal",amount:501},{paymentMethod:"unknown"},{person:"Shared Money"},{date:"2026-02-30"},{dueDate:""},{dueDate:"invalid"}]) {
  const record=loan(overrides);assert.ok(receivableError(state,record));assert.equal(applyReceivable(state,record),state);
 }
 const lent=applyReceivable(state,loan());
 for(const overrides of [{receivableId:"missing"},{amount:301},{amount:0},{amount:-1},{amount:1.001},{amount:Infinity},{paymentMethod:"unknown"},{person:"Shared Money"},{date:""}]) {
  const p=payment(overrides);assert.ok(receivablePaymentError(lent,p));assert.equal(applyReceivablePayment(lent,p),lent);
 }
});

test("migration removes only lending expenses, preserves metadata, balances and is repeatable",()=>{
 const state=fresh();state.expenses=[{id:"old",name:"Alex",amount:200,category:"Lends money to",paidBy:"Ruru",paymentMethod:"Cash",date:"2026-11-01T14:00",cutoffId:"old",notes:"Lunch loan"},{id:"food",name:"Cafe",amount:50,category:"Food",paidBy:"Ruru",paymentMethod:"Cash"}];
 const balance=walletBalance(state,"Ruru","Cash");const migrated=normalizeImportedState(state);
 assert.equal(migrated.expenses.length,1);assert.equal(actualSpend(migrated.expenses),50);
 assert.equal(walletBalance(migrated,"Ruru","Cash"),balance);assert.equal(receivableBalance(migrated,"receivable-old"),200);
 assert.equal(migrated.receivables[0].borrowerName,"Alex");assert.equal(migrated.receivables[0].notes,"Lunch loan");
 assert.equal(migrated.receivables[0].date,"2026-11-01T14:00");assert.equal(migrated.receivables[0].dueDate,undefined);
 assert.deepEqual(migrateLendingExpenses(migrated),migrated);
 const restored=migrateLendingExpenses({...migrated,expenses:state.expenses});assert.equal(restored.receivables.length,1);
 migrated.walletMethods=[];assert.ok(allWalletMethods(migrated).includes("Cash"));
 migrated.expenses[0].date="2026-11-08";
 assert.equal(buildTransactions(migrated).find(t=>t.id==="tx-receivable-old").type,"Receivable");
});
