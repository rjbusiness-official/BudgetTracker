import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = await readFile(new URL("../src/components/Receivables.tsx",import.meta.url),"utf8");
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function harness() {
 const values=[];let cursor=0;const calls=[];
 const state={receivables:[{id:"loan",borrowerName:"Alex",amount:300,date:"2026-11-08"}],savingsGoals:[{id:"goal",name:"Savings",owner:"Combined",currentSavings:100}],receivablePayments:[]};
 const exports={};
 vm.runInNewContext(compiled,{exports,require(name){
  if(name==="react")return {useState(initial){const index=cursor++;if(!(index in values))values[index]=typeof initial==="function"?initial():initial;return [values[index],value=>{values[index]=value;}];}};
  if(name==="react/jsx-runtime")return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name.includes("AmountPrivacyContext"))return {useAmountPrivacy:()=>({hidden:false,formatCurrency:String})};
  if(name.includes("BudgetContext"))return {useBudget:()=>({state,sync:{isLoading:false},actions:{lendMoney:r=>{calls.push(r);return "";},receiveReceivable:r=>{calls.push(r);return "";}}})};
  if(name.includes("finance"))return {getWalletMethods:()=>["Cash"],walletBalance:()=>1000,formatCurrency:String,formatShortDate:v=>v,getActiveCutoff:()=>({id:"current"}),receivableBalance:()=>200};
  return {};
 }});
 const render=name=>{cursor=0;return exports[name]({onBack(){}});};
 const nodes=(tree)=> !tree || typeof tree!=="object" ? [] : [tree,...(Array.isArray(tree.props?.children)?tree.props.children:[tree.props?.children]).flat(Infinity).flatMap(nodes)];
 const field=(tree,label)=>nodes(tree).find(n=>n.props?.label===label)?.props.children;
 return {render,nodes,field,calls};
}

test("due date is absent until checked, then required; unchecking omits a previously entered date",()=>{
 const h=harness();let tree=h.render("default");assert.equal(h.field(tree,"Due date"),undefined);
 h.nodes(tree).find(n=>n.props?.type==="checkbox").props.onChange({target:{checked:true}});
 tree=h.render("default");assert.equal(h.field(tree,"Due date").props.required,true);
 h.field(tree,"Due date").props.onChange({target:{value:"2026-12-01"}});
 h.nodes(tree).find(n=>n.props?.type==="checkbox").props.onChange({target:{checked:false}});
 tree=h.render("default");
 h.field(tree,"Borrower's name").props.onChange({target:{value:"Alex"}});
 h.field(tree,"Amount").props.onChange({target:{value:"50"}});
 const select=h.field(tree,"Wallet / Savings");
 assert.ok(select.props.children.flat().some(n=>n.props?.value?.includes("savings")));
 select.props.onChange({target:{value:JSON.stringify(["Ruru","Cash"])}});
 tree=h.render("default");h.nodes(tree).find(n=>n.type==="form").props.onSubmit({preventDefault(){}});
 assert.equal(h.calls[0].dueDate,undefined);assert.equal(h.calls[0].borrowerName,"Alex");assert.equal(h.calls[0].amount,50);
});

test("selecting a borrower defaults to the outstanding amount and permits a smaller repayment",()=>{
 const h=harness();let tree=h.render("ReceivableRepaymentForm");
 h.field(tree,"Borrower").props.onChange({target:{value:"loan"}});
 tree=h.render("ReceivableRepaymentForm");assert.equal(h.field(tree,"Amount received").props.value,"200");
 h.field(tree,"Amount received").props.onChange({target:{value:"75"}});
 h.field(tree,"Receive into").props.onChange({target:{value:"Cash"}});
 tree=h.render("ReceivableRepaymentForm");h.nodes(tree).find(n=>n.type==="form").props.onSubmit({preventDefault(){}});
 assert.equal(h.calls[0].amount,75);assert.equal(h.calls[0].receivableId,"loan");assert.equal(h.calls[0].paymentMethod,"Cash");
});

test("repayment destination lists savings and submits the selected savings account",()=>{
 const h=harness();let tree=h.render("ReceivableRepaymentForm");
 const options=h.field(tree,"Receive into").props.children.flat();
 assert.ok(options.some(n=>n.props?.value==="savings:goal"));
 h.field(tree,"Borrower").props.onChange({target:{value:"loan"}});
 h.field(tree,"Receive into").props.onChange({target:{value:"savings:goal"}});
 tree=h.render("ReceivableRepaymentForm");
 assert.equal(h.field(tree,"Receive for"),undefined);
 h.nodes(tree).find(n=>n.type==="form").props.onSubmit({preventDefault(){}});
 assert.equal(h.calls[0].goalId,"goal");assert.equal(h.calls[0].amount,200);
 assert.equal(h.calls[0].paymentMethod,"");
});
