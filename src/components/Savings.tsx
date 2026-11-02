"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { NavLink } from "react-router-dom";
import { useBudget } from "@/src/context/BudgetContext";
import type { SavingsGoal, SavingsDestination, SavingsOwner } from "@/src/types/budget";
import { formatCurrency, formatShortDate, getActiveCutoff, getWalletMethods, savingsForOwner } from "@/src/utils/finance";
import { Button, Field, Modal, PageHeader, Panel, inputClass } from "./ui";

const owners: SavingsOwner[] = ["Ruru", "Joselle", "Combined"];
const today = () => new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Manila",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());

function DeleteSavings({ goal }: { goal: SavingsGoal }) {
  const { state, actions, sync } = useBudget();
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [person, setPerson] = useState<"Ruru" | "Joselle">(goal.owner === "Joselle" ? "Joselle" : "Ruru");
  const [method, setMethod] = useState("");
  const [error, setError] = useState("");
  const banks = getWalletMethods(state);
  const otherSavings = state.savingsGoals.filter(item => item.id !== goal.id && item.owner);
  const [balance, setBalance] = useState(goal.currentSavings);
  const remove = (target?: SavingsDestination) => {
    const result = actions.deleteSavingsGoal({ goalId: goal.id, balance: open ? balance : goal.currentSavings, destination: target, date: today(), cutoffId: getActiveCutoff(state).id });
    if (result) { setError(result); return; }
    setOpen(false);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();setError("");
    if (!destination) {setError("Choose where to transfer the balance.");return;}
    remove(destination === "wallet" ? {type: "wallet", person, paymentMethod: method} : {type: "savings", goalId: destination.slice(8)});
  };
  const destinationLabel = destination === "wallet" ? person + "’s " + method + " wallet" : otherSavings.find(item => "savings:" + item.id === destination)?.name || "the selected account";
  return <>
    <Button variant="danger" disabled={sync.isLoading || sync.isSaving} confirm={goal.currentSavings === 0 ? "Delete empty savings account “" + goal.name + "”?" : false} onClick={() => {
      setError("");
      if (goal.currentSavings === 0) remove();
      else {setBalance(goal.currentSavings);setDestination("");setMethod("");setOpen(true);}
    }}>Delete savings</Button>
    {!open && error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {open && <Modal title={"Delete " + goal.name} onClose={() => setOpen(false)}>
      <form onSubmit={submit} className="grid gap-4">
        <p>Transfer the full balance of <strong>{formatCurrency(balance)}</strong> before deleting this savings account.</p>
        <Field label="Transfer balance to"><select className={inputClass} required value={destination} onChange={event => {setDestination(event.target.value);setError("");}}>
          <option value="" disabled>Select destination</option>
          <option value="wallet" disabled={!banks.length}>A wallet</option>
          {otherSavings.map(item => <option key={item.id} value={"savings:" + item.id}>{item.owner} · {item.name} · {item.paymentMethod}</option>)}
        </select></Field>
        {destination === "wallet" && <>
          <Field label="Whose wallet?"><select className={inputClass} value={person} onChange={event => setPerson(event.target.value as "Ruru" | "Joselle")}><option>Ruru</option><option>Joselle</option></select></Field>
          <Field label="Destination wallet"><select className={inputClass} required value={method} onChange={event => setMethod(event.target.value)}><option value="" disabled>Select wallet</option>{banks.map(bank => <option key={bank}>{bank}</option>)}</select></Field>
        </>}
        {!banks.length && !otherSavings.length && <p>Create another savings account or add a wallet in Settings before deleting this account.</p>}
        <p className="text-sm text-slate-600">The balance moves to your chosen destination. Existing transaction history is kept.</p>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" variant="danger" disabled={sync.isLoading || sync.isSaving || !destination || (destination === "wallet" && !method)} confirm={"Transfer " + formatCurrency(balance) + " from “" + goal.name + "” to " + destinationLabel + ", then delete this savings account?"}>Transfer and delete</Button>
        </div>
      </form>
    </Modal>}
  </>;
}

export function SavingsSettings() {
  const { state, actions, sync } = useBudget();
  const banks = getWalletMethods(state);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState<SavingsOwner>("Ruru");
  const [bank, setBank] = useState(banks[0] || "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setNotice("");
    const trimmed = name.trim();
    if (!trimmed) {setError("Enter a savings name.");return;}
    if (!banks.includes(bank)) {setError("Choose a bank or wallet from Settings.");return;}
    if (state.savingsGoals.some(goal=>goal.owner===owner && goal.name.toLowerCase()===trimmed.toLowerCase())) {setError("This owner already has a savings account with that name.");return;}
    actions.upsertSavingsGoal({name:trimmed,owner,paymentMethod:bank,targetAmount:0,currentSavings:0,contributionThisCutoff:0,targetDate:""});
    setName("");setNotice(trimmed + " savings created for " + owner + " at " + bank + ".");
  };
  return <div className="mx-auto grid max-w-3xl gap-5">
    <PageHeader title="Add new savings" description="Name your savings, choose who it belongs to, and select where it is kept." />
    <Panel><form onSubmit={submit} className="grid gap-4">
      <Field label="Name of savings"><input className={inputClass} required maxLength={80} value={name} onChange={event=>setName(event.target.value)} placeholder="e.g. Emergency Fund" /></Field>
      <Field label="Whos saving?"><select className={inputClass} required value={owner} onChange={event=>setOwner(event.target.value as SavingsOwner)}>{owners.map(person=><option key={person}>{person}</option>)}</select></Field>
      <Field label="Bank / wallet / cash"><select className={inputClass} required value={bank} onChange={event=>setBank(event.target.value)}><option value="" disabled>Select bank or wallet</option>{banks.map(method=><option key={method}>{method}</option>)}</select></Field>
      {!banks.length && <NavLink className="text-sm text-[#1676ba]" to="/wallet-settings">Add a bank or wallet first</NavLink>}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}{notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      <Button confirm={"Create savings account “" + name + "” for " + owner + " at " + bank + "?"} type="submit" className="w-fit" disabled={sync.isLoading || !banks.length}>Add savings</Button>
    </form></Panel>
    <Panel><h2 className="text-lg font-semibold">Savings accounts</h2><div className="mt-4 grid gap-3">{state.savingsGoals.filter(goal=>goal.owner).map(goal=><div key={goal.id} className="flex flex-wrap justify-between gap-3 rounded-2xl border border-[#ececf1] p-4"><div><h3 className="font-semibold">{goal.name}</h3><p className="text-sm text-slate-500">{goal.owner} · {goal.paymentMethod}</p></div><div className="flex flex-wrap items-center gap-3"><span className="font-semibold">{formatCurrency(goal.currentSavings)}</span><DeleteSavings goal={goal}/></div></div>)}{!state.savingsGoals.some(goal=>goal.owner) && <p className="text-sm text-slate-500">No named savings accounts yet.</p>}</div></Panel>
  </div>;
}

export function SavingsPage() {
  const {state,actions,sync} = useBudget();
  const [owner,setOwner] = useState<SavingsOwner>("Ruru");
  const [goalId,setGoalId] = useState("");
  const [contributor,setContributor] = useState<"Ruru"|"Joselle">("Ruru");
  const [amount,setAmount] = useState("");
  const [date,setDate] = useState(today());
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const goals = savingsForOwner(state,owner);
  const goal = goals.find(item=>item.id===goalId);
  const person = owner === "Combined" ? contributor : owner;

  const history = state.savingsTransactions.filter(transaction=>goals.some(item=>item.id===transaction.goalId)).slice().sort((a,b)=>b.date.localeCompare(a.date));
  const submit = (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();setError("");setNotice("");
    if (!goal?.paymentMethod) {setError("Choose a savings account.");return;}
    const result=actions.contributeToSavings({goalId:goal.id,person,paymentMethod:goal.paymentMethod,amount:Number(amount),date,type:"Contribution",cutoffId:getActiveCutoff(state).id,notes:"Contribution to " + owner + " savings"});
    if (result) {setError(result);return;}
    setNotice(formatCurrency(Number(amount)) + " added to " + goal.name + " at " + goal.paymentMethod + ".");setAmount("");
  };
  return <div className="mx-auto grid max-w-3xl gap-5">
    <PageHeader title="Savings" description="Add money to a named savings account." actions={<NavLink className="text-sm font-semibold text-[#1676ba]" to="/savings-settings">Add new savings</NavLink>}/>
    <Panel><form onSubmit={submit} className="grid gap-4">
      <Field label="Who?"><select className={inputClass} value={owner} onChange={event=>{setOwner(event.target.value as SavingsOwner);setGoalId("");setError("");setNotice("");}}>{owners.map(person=><option key={person}>{person}</option>)}</select></Field>
      <Field label="Name of savings"><select className={inputClass} required value={goalId} onChange={event=>{setGoalId(event.target.value);setError("");setNotice("");}}><option value="" disabled>Select savings</option>{goals.map(item=><option key={item.id} value={item.id}>{item.name} · {item.paymentMethod}</option>)}</select></Field>
      {!goals.length && <p className="text-sm text-slate-500">No savings accounts for {owner}. Create one in Settings → Add new savings.</p>}
      {owner==="Combined" && <Field label="Contributed by"><select className={inputClass} value={contributor} onChange={event=>setContributor(event.target.value as "Ruru"|"Joselle")}><option>Ruru</option><option>Joselle</option></select></Field>}
      {goal && <div className="rounded-2xl bg-[#e7f5ff] p-4 text-sm"><p>Saved at <strong>{goal.paymentMethod}</strong> · Savings balance <strong>{formatCurrency(goal.currentSavings)}</strong></p></div>}
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Amount"><input className={inputClass} required type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={event=>setAmount(event.target.value)} /></Field><Field label="Date"><input className={inputClass} required type="date" value={date} onChange={event=>setDate(event.target.value)}/></Field></div>
      <p className="text-sm text-slate-500">This records money already in savings. Your wallet balance stays unchanged. Use Transfer Funds to move money from a wallet.</p>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}{notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      <Button confirm={"Record " + formatCurrency(Number(amount)) + " in " + goal?.name + "? Your wallet balance will stay unchanged."} type="submit" className="w-fit" disabled={sync.isLoading || !goal}>Record savings</Button>
    </form></Panel>
    <Panel><h2 className="text-lg font-semibold">{owner} savings</h2><div className="mt-4 grid gap-3">{goals.map(item=><div key={item.id} className="flex flex-wrap justify-between gap-3 rounded-2xl border border-[#ececf1] p-4"><div><p className="font-semibold">{item.name}</p><p className="text-sm text-slate-500">{item.paymentMethod}</p></div><div className="flex flex-wrap items-center gap-3"><strong>{formatCurrency(item.currentSavings)}</strong><DeleteSavings goal={item}/></div></div>)}</div>
      <h3 className="mt-5 font-semibold">Contribution history</h3><div className="mt-3 grid gap-3">{history.map(transaction=><div key={transaction.id} className="flex flex-wrap justify-between gap-3 border-t border-[#ececf1] pt-3 text-sm"><div><p>{goals.find(item=>item.id===transaction.goalId)?.name}</p><p className="text-slate-500">{transaction.person} · {transaction.paymentMethod} · {formatShortDate(transaction.date)}</p></div><span>{formatCurrency(transaction.amount)}</span></div>)}{!history.length && <p className="text-sm text-slate-500">No contributions yet.</p>}</div>
    </Panel>
  </div>;
}
