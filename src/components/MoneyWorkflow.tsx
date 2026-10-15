"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { NavLink } from "react-router-dom";
import { useBudget } from "@/src/context/BudgetContext";
import type { Expense, Income, PaymentMethod } from "@/src/types/budget";
import { monthlyBillCategories } from "@/src/utils/monthlyBills";
import { formatCurrency, getActiveCutoff } from "@/src/utils/finance";
import DebtAmortization from "./DebtAmortization";
import { Button, Field, Panel, PageHeader, inputClass } from "./ui";

const today = () => new Date().toLocaleDateString("en-CA");
const now = () => { const d = new Date(); return today() + "T" + String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0"); };
const money = (v: string) => Math.round(Number(v || 0) * 100) / 100;
const methods: PaymentMethod[] = ["Cash", "GCash", "Maya", "BDO", "GoTyme", "Bank Transfer", "Debit Card", "Other"];
function Amount({label, value, onChange}: {label:string; value:string; onChange:(value:string)=>void}) {
 return <Field label={label}><input className={inputClass} aria-label={label} type="number" min="0" step="0.01" value={value} onChange={e=>onChange(e.target.value)} placeholder="0.00" /></Field>;
}
export function TodayExpenses() {
 const { state, actions } = useBudget();
 const blank = () => ({id:crypto.randomUUID(), vendor:"", category:"Food", date:now(), amount:""});
 const [rows,setRows] = useState([blank()]);
 const [notice,setNotice] = useState("");
 const [payee,setPayee] = useState("");
 const [date,setDate] = useState(today());
 const [person,setPerson] = useState<Expense["paidBy"]>("Ruru");
 const [method,setMethod] = useState<PaymentMethod>("Cash");
 const submit = (e:FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  rows.forEach(row=>actions.addExpense({name:row.vendor.trim(),category:row.category,date:row.date,amount:money(row.amount),paidBy:person,paymentMethod:method,cutoffId:getActiveCutoff(state).id,payeeName:payee.trim(),formDate:date}));
  setRows([blank()]); setNotice("Expenses recorded.");
 };
 return <div className="mx-auto grid max-w-5xl gap-4"><PageHeader title="Todays Expense" description="Record your expenses together, one vendor per row." actions={<NavLink className="text-sm font-semibold text-[#1676ba]" to="/expense-history">Expense history</NavLink>}/><Panel><form onSubmit={submit} className="grid gap-5"><div className="grid gap-3 sm:grid-cols-2"><Field label="Payee Name"><input className={inputClass} required value={payee} onChange={e=>setPayee(e.target.value)} pattern=".*\S.*" /></Field><Field label="Date"><input className={inputClass} required type="date" value={date} onChange={e=>setDate(e.target.value)} /></Field><Field label="Paid by"><select className={inputClass} value={person} onChange={e=>setPerson(e.target.value as Expense["paidBy"])}><option>Ruru</option><option>Joselle</option><option>Shared Money</option></select></Field><Field label="Payment method"><select className={inputClass} value={method} onChange={e=>setMethod(e.target.value as PaymentMethod)}>{methods.map(m=><option key={m}>{m}</option>)}</select></Field></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Vendor","Type of Expense","Date","Amount",""].map((h,i)=><th className="p-2" key={i}>{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}>{["vendor","category","date","amount"].map(key=><td className="min-w-36 p-2" key={key}>{key==="category"?<select className={inputClass} aria-label="Type of Expense" value={row.category} onChange={e=>setRows(rows.map(r=>r.id===row.id?{...r,category:e.target.value}:r))}>{["Food","Transpo","Gas","Item","others"].map(c=><option key={c}>{c}</option>)}</select>:<input className={inputClass} aria-label={key==="vendor"?"Vendor":key==="date"?"Expense date":"Amount"} required type={key==="date"?"datetime-local":key==="amount"?"number":"text"} min={key==="amount"?"0.01":undefined} step={key==="amount"?"0.01":undefined} pattern={key==="vendor"?".*\S.*":undefined} value={row[key as keyof typeof row]} onChange={e=>setRows(rows.map(r=>r.id===row.id?{...r,[key]:e.target.value}:r))}/>}</td>)}<td className="p-2"><Button variant="ghost" disabled={rows.length===1} onClick={()=>setRows(rows.filter(r=>r.id!==row.id))}>Delete row</Button></td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3"><Button variant="secondary" onClick={()=>setRows([...rows,blank()])}>Add row</Button><p className="font-semibold">Total: {formatCurrency(rows.reduce((n,r)=>n+money(r.amount),0))}</p><Button type="submit">Save expenses</Button></div>{notice&&<p role="status" className="text-emerald-700">{notice}</p>}</form></Panel></div>;
}

export function MoneyInWorkflow() {
 const {state,actions} = useBudget();
 const [kind,setKind]=useState("Record Salary");
 const [step,setStep]=useState(0);
 const [person,setPerson]=useState<Income["person"]>("Husband");
 const [amount,setAmount]=useState("");
 const [date,setDate]=useState(today());
 const [method,setMethod]=useState<PaymentMethod>("Cash");
 const [source,setSource]=useState("");
 const [values,setValues]=useState<Record<string,string>>({});
 const [notice,setNotice]=useState("");
 const [expanded,setExpanded]=useState<string[]>([]);
 const [saved,setSaved]=useState(false);
 const bills = monthlyBillCategories(state);
 const debts=state.debts.filter(d=>d.remainingBalance>0);
 const wishes=state.wishlistItems.filter(w=>w.status!=="Purchased"&&w.status!=="Cancelled");
 const val=(key:string)=>values[key]||"";
 const set=(key:string,value:string)=>setValues(v=>({...v,[key]:value}));
 const total=Object.values(values).reduce((n,v)=>n+Math.round(money(v)*100),0)/100;
 const remaining=Math.round((money(amount)-total)*100)/100;
 const titles=["Money In","Whose Salary","Allocation for Monthly bills","Debt payments","Family Share","Allocation for Wishlist","Pocket Money and Savings"];
 const save=()=>{
  if(remaining<0){setNotice("Allocations cannot exceed the salary amount.");return;}
  if(debts.some(d=>money(val("debt:"+d.id))>d.remainingBalance)){setNotice("A debt payment exceeds its remaining balance. Return to Debt payments to adjust it.");return;}
  actions.recordSalaryWorkflow({income:{source:kind==="Record Salary"?"Salary":source.trim()||"Extra Money",person,amount:money(amount),date,paymentMethod:method,type:kind==="Record Salary"?"Salary":"Other",cutoffId:getActiveCutoff(state).id},allocations:kind==="Record Salary"?Object.entries(values).filter(([key])=>!key.startsWith("debt:")).map(([category,value])=>({category,amount:money(value)})):[],debtPayments:kind==="Record Salary"?debts.map(d=>({debtId:d.id,amount:money(val("debt:"+d.id))})).filter(p=>p.amount>0):[]});
  setSaved(true);setNotice("Money in recorded. Debt balances and amortization schedules are updated.");
 };
 const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setNotice("");if(step===0){setStep(1);return;}if(step===1&&kind==="Extra Money"){save();return;}if(remaining<0){setNotice("Allocations cannot exceed the salary amount.");return;}if(step===6)save();else { if(step===2) setValues(v=>({...Object.fromEntries(debts.map(d=>["debt:"+d.id,String(Math.min(d.remainingBalance,d.plannedPayment||d.minimumPayment))])),...v})); setStep(step+1); }};
 const fields=(keys:string[],prefix="")=><div className="grid gap-4 sm:grid-cols-2">{keys.map(k=><Amount key={k} label={k} value={val(prefix+k)} onChange={v=>set(prefix+k,v)}/>)}</div>;
 if(saved)return <div className="mx-auto grid max-w-3xl gap-4"><PageHeader title="Money In saved" description={notice}/><Panel><p>Salary allocations reserve money; bills and wishlist allocations do not mark them as paid or purchased.</p><div className="mt-4 flex gap-3"><Button onClick={()=>{setStep(0);setValues({});setAmount("");setNotice("");setSaved(false);}}>Record another</Button><NavLink className="p-2 font-semibold text-[#1676ba]" to="/dashboard">View Dashboard</NavLink></div>{state.debts.filter(d=>expanded.includes(d.id)).map(d=><DebtAmortization key={d.id} debt={d} payments={state.debtPayments}/>)}</Panel></div>;
 return <div className="mx-auto grid max-w-3xl gap-4"><PageHeader title={titles[step]} description={step?kind==="Record Salary"?"Step "+step+" of 6":"Record extra money received.":"Choose the money you want to record."}/>{step>0&&kind==="Record Salary"&&<div className="sticky top-3 z-10 rounded-[22px] border border-[#d9cfee] bg-[#e3dcf6] p-4 shadow-sm" role="status"><p className="text-sm">Remaining salary balance</p><p className={"text-2xl font-semibold "+(remaining<0?"text-rose-700":"text-[#51436d]")}>{formatCurrency(remaining)}</p><p className="text-xs text-slate-600">Salary {formatCurrency(money(amount))} · Allocated {formatCurrency(total)}</p></div>}<Panel><form onSubmit={submit} className="grid gap-5">{step===0?<Field label="Income type"><select className={inputClass} value={kind} onChange={e=>setKind(e.target.value)}><option>Record Salary</option><option>Extra Money</option></select></Field>:step===1?<div className="grid gap-4 sm:grid-cols-2"><Field label={kind==="Record Salary"?"Whose Salary":"Whose money"}><select className={inputClass} value={person} onChange={e=>setPerson(e.target.value as Income["person"])}><option value="Husband">Ruru</option><option value="Wife">Joselle</option></select></Field><Field label="Amount received"><input className={inputClass} type="number" min="0.01" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></Field><Field label="Date received"><input className={inputClass} type="date" required value={date} onChange={e=>setDate(e.target.value)}/></Field><Field label="Receive into"><select className={inputClass} value={method} onChange={e=>setMethod(e.target.value as PaymentMethod)}>{methods.map(m=><option key={m}>{m}</option>)}</select></Field>{kind==="Extra Money"&&<Field label="Source"><input className={inputClass} required value={source} onChange={e=>setSource(e.target.value)}/></Field>}</div>:step===2?<>{fields(bills,"bill:")}<NavLink to="/settings" className="text-sm text-[#1676ba]">Manage monthly bills in Settings</NavLink></>:step===3?<>{!debts.length&&<p>No outstanding debts. Add debts in Settings or continue.</p>}{debts.map(d=><div className="rounded-[22px] border border-[#ececf1] bg-[#fafafd] p-5" key={d.id}><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">{d.name}</h2><p className="text-sm text-slate-500">Balance {formatCurrency(d.remainingBalance)} · Suggested {formatCurrency(Math.min(d.remainingBalance,d.plannedPayment||d.minimumPayment))}</p></div><Button variant="secondary" onClick={()=>setExpanded(expanded.includes(d.id)?expanded.filter(id=>id!==d.id):[...expanded,d.id])}>{expanded.includes(d.id)?"Collapse":"Expand"}</Button></div><div className="mt-3"><Amount label={d.name+" payment"} value={val("debt:"+d.id)} onChange={v=>set("debt:"+d.id,v)}/></div>{expanded.includes(d.id)&&<DebtAmortization debt={d} payments={state.debtPayments}/>}</div>)}</>:step===4?fields(["Family Share"]):step===5?<>{!wishes.length&&<p>No wishlist items yet. Add goals such as Trip to Vietnam or New Phone in Settings.</p>}{fields(wishes.map(w=>w.name),"wish:")}</>:<>{fields(["Pocket Money","Savings"])}<p className="text-sm text-slate-500">Unallocated balance stays in your wallet. Savings is transferred to savings when you save.</p><div className="rounded-[22px] bg-slate-50 p-4 text-sm"><h2 className="font-semibold">Review allocations</h2>{Object.entries(values).filter(([,v])=>money(v)>0).map(([key,v])=><div className="flex justify-between gap-3 py-1" key={key}><span>{key.startsWith("debt:")?state.debts.find(d=>d.id===key.slice(5))?.name:key.replace(/^(bill:|wish:)/,"")}</span><span>{formatCurrency(money(v))}</span></div>)}</div></>}{notice&&<p role="alert" className="text-rose-700">{notice}</p>}<div className="flex justify-between gap-3">{step>0?<Button variant="secondary" onClick={()=>{setNotice("");setStep(step-1);}}>Back</Button>:<span/>}<Button type="submit">{step===6||(step===1&&kind==="Extra Money")?"Save Money In":"Next"}</Button></div></form></Panel></div>;
}
