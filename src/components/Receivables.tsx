"use client";

import { useState, type FormEvent } from "react";
import { NavLink } from "react-router-dom";
import { useBudget } from "@/src/context/BudgetContext";
import { formatCurrency, formatShortDate, getActiveCutoff, getWalletMethods, receivableBalance, walletBalance } from "@/src/utils/finance";
import { Button, Field, PageHeader, Panel, inputClass } from "./ui";

const today = () => new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Manila",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());

export function ReceivablesSummary({activeOnly = false}: {activeOnly?: boolean}) {
  const {state} = useBudget();
  const records = (state.receivables || []).filter(record => !activeOnly || receivableBalance(state,record.id) > 0);
  const outstanding = records.reduce((n,r)=>n+Math.round(receivableBalance(state,r.id)*100),0)/100;
  return <Panel><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Receivables · {formatCurrency(outstanding)}</h2><NavLink to="/receivables" className="text-sm font-semibold text-violet-700">Manage receivables</NavLink></div><div className="mt-4 grid gap-3">{records.map(record => {
    const balance = receivableBalance(state,record.id);
    return <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ececf1] p-4"><div><p className="font-semibold">{record.borrowerName}</p><p className="text-sm text-slate-500">Borrowed {formatCurrency(record.amount)} · {record.person} · {record.goalName || record.paymentMethod}</p><p className={balance > 0 && record.dueDate && record.dueDate < today() ? "text-sm text-rose-700" : "text-sm text-slate-500"}>{balance === 0 ? "Paid" : record.dueDate ? "Due " + formatShortDate(record.dueDate) : "No due date"}</p></div><span className="font-semibold">{formatCurrency(balance)} remaining</span></div>;
  })}{!records.length && <p className="text-sm text-slate-500">{activeOnly ? "No active receivables." : "No receivables recorded yet."}</p>}</div></Panel>;
}

export default function ReceivablesPage() {
  const {state,actions,sync} = useBudget();
  const [name,setName] = useState("");
  const [amount,setAmount] = useState("");
  const [account,setAccount] = useState("");
  const [hasDue,setHasDue] = useState(false);
  const [dueDate,setDueDate] = useState("");
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");
  const methods = getWalletMethods(state);
  const options = [
    ...(["Ruru","Joselle"] as const).flatMap(person=>methods.map(paymentMethod=>({key:JSON.stringify([person,paymentMethod]),label:person+" · "+paymentMethod,person,paymentMethod,goalId:undefined as string | undefined,balance:walletBalance(state,person,paymentMethod)}))),
    ...state.savingsGoals.map(goal=>({key:JSON.stringify(["savings",goal.id]),label:(goal.owner || "Combined")+" · "+goal.name+" (Savings)",person:goal.owner === "Combined" || !goal.owner ? "Shared Money" as const : goal.owner,paymentMethod:goal.paymentMethod || "",goalId:goal.id,balance:goal.currentSavings}))
  ];
  const selected = options.find(o=>o.key===account);
  const submit = (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault();setError("");setNotice("");
    if (!selected) {setError("Choose a wallet or savings account.");return;}
    const result = actions.lendMoney({borrowerName:name,amount:Number(amount),dueDate:hasDue ? dueDate : undefined,person:selected.person,paymentMethod:selected.paymentMethod,goalId:selected.goalId,date:today(),cutoffId:getActiveCutoff(state).id});
    if (result) {setError(result);return;}
    setNotice("Receivable recorded. The selected account has been deducted.");setName("");setAmount("");setDueDate("");setHasDue(false);
  };
  return <div className="mx-auto grid max-w-3xl gap-4"><PageHeader title="Receivables" description="Record money lent and track outstanding repayments."/><Panel><form onSubmit={submit} className="grid gap-4"><Field label="Borrower's name"><input required className={inputClass} value={name} onChange={e=>setName(e.target.value)}/></Field><Field label="Amount"><input required className={inputClass} type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></Field><Field label="Wallet / Savings"><select required className={inputClass} value={account} onChange={e=>setAccount(e.target.value)}><option value="" disabled>Select account</option>{options.map(o=><option key={o.key} value={o.key}>{o.label} · {formatCurrency(o.balance)}</option>)}</select></Field>{selected && <p className="text-sm text-slate-500">Available: {formatCurrency(selected.balance)}</p>}<label className="flex items-center gap-2"><input type="checkbox" checked={hasDue} onChange={e=>setHasDue(e.target.checked)}/>Set a due date</label>{hasDue && <Field label="Due date"><input required className={inputClass} type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></Field>}{error && <p role="alert" className="text-rose-700">{error}</p>}{notice && <p role="status" className="text-emerald-700">{notice}</p>}<Button type="submit" disabled={sync.isLoading} confirm={"Lend " + formatCurrency(Number(amount)) + " to " + name + "?"}>Record receivable</Button></form></Panel><ReceivablesSummary/></div>;
}

export function ReceivableRepaymentForm({onBack}: {onBack:()=>void}) {
  const {state,actions,sync} = useBudget();
  const [id,setId] = useState("");
  const [amount,setAmount] = useState("");
  const [person,setPerson] = useState<"Ruru" | "Joselle">("Ruru");
  const [method,setMethod] = useState("");
  const [date,setDate] = useState(today());
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const goalId = method.startsWith("savings:") ? method.slice(8) : undefined;
  const goal = state.savingsGoals.find(item => item.id === goalId);
  const outstanding = (state.receivables || []).filter(r=>receivableBalance(state,r.id)>0);
  const submit = (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault();setNotice("");
    const result = actions.receiveReceivable({receivableId:id,amount:Number(amount),person:goal?.owner === "Ruru" || goal?.owner === "Joselle" ? goal.owner : person,paymentMethod:goalId ? goal?.paymentMethod || "" : method,goalId,date,cutoffId:getActiveCutoff(state).id});
    setError(result);if(result)return;
    setNotice("Repayment recorded. The outstanding balance and receiving account are updated.");setId("");setAmount("");
  };
  return <div className="mx-auto grid max-w-3xl gap-4"><PageHeader title="Receivable repayment" description="Record a full or partial repayment into a wallet or savings account."/><Panel><form className="grid gap-4" onSubmit={submit}><Field label="Borrower"><select required className={inputClass} value={id} onChange={e=>{setId(e.target.value);setAmount(String(receivableBalance(state,e.target.value)));setError("");setNotice("");}}><option value="" disabled>Select borrower</option>{outstanding.map(r=><option key={r.id} value={r.id}>{r.borrowerName} · {formatShortDate(r.date)} · {formatCurrency(receivableBalance(state,r.id))} remaining</option>)}</select></Field>{!outstanding.length && <p>No outstanding receivables.</p>}<Field label="Amount received"><input required className={inputClass} type="number" min="0.01" step="0.01" max={id ? receivableBalance(state,id) : undefined} value={amount} onChange={e=>setAmount(e.target.value)}/></Field>{!goalId && <Field label="Receive for"><select className={inputClass} value={person} onChange={e=>setPerson(e.target.value as typeof person)}><option>Ruru</option><option>Joselle</option></select></Field>}<Field label="Receive into"><select required className={inputClass} value={method} onChange={e=>setMethod(e.target.value)}><option value="" disabled>Select wallet or savings</option>{getWalletMethods(state).map(m=><option key={m}>{m}</option>)}{state.savingsGoals.map(item=><option key={item.id} value={"savings:"+item.id}>{item.owner || "Combined"} ? {item.name} (Savings)</option>)}</select></Field><Field label="Date received"><input required type="date" className={inputClass} value={date} onChange={e=>setDate(e.target.value)}/></Field>{error && <p role="alert" className="text-rose-700">{error}</p>}{notice && <p role="status" className="text-emerald-700">{notice}</p>}<div className="flex gap-3"><Button variant="secondary" onClick={onBack}>Back</Button><Button type="submit" disabled={sync.isLoading || !id} confirm={"Record repayment of " + formatCurrency(Number(amount)) + "?"}>Save repayment</Button></div></form></Panel></div>;
}
