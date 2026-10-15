"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRightLeft } from "lucide-react";
import { useBudget } from "@/src/context/BudgetContext";
import type { FundTransfer, PaymentMethod } from "@/src/types/budget";
import { formatCurrency, formatShortDate, getActiveCutoff, getWalletMethods, walletBalance } from "@/src/utils/finance";
import { Button, EmptyState, Field, PageHeader, Panel, inputClass } from "./ui";

export default function TransferFunds() {
  const { state, actions, sync } = useBudget();
  const transferMethods = getWalletMethods(state);
  const [person, setPerson] = useState<FundTransfer["person"]>("Ruru");
  const [from, setFrom] = useState<PaymentMethod>(() => transferMethods.includes("BDO") ? "BDO" : transferMethods[0] || "");
  const [to, setTo] = useState<PaymentMethod>(() => transferMethods.find(method => method !== from) || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Manila",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const available = walletBalance(state, person, from);
  const history = (state.fundTransfers || []).slice().sort((a,b) => b.date.localeCompare(a.date));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setNotice("");
    const result = actions.transferFunds({person,fromMethod:from,toMethod:to,amount:Number(amount),date,cutoffId:getActiveCutoff(state).id,notes:notes.trim()});
    if (result) { setError(result); return; }
    setNotice(formatCurrency(Number(amount)) + " transferred from " + from + " to " + to + " for " + person + ".");
    setAmount(""); setNotes("");
  };
  return <div className="mx-auto grid max-w-3xl gap-5">
    <PageHeader title="Transfer Funds" description="Move money between your wallets, such as BDO to Cash or GCash." />
    <Panel>{transferMethods.length < 2 && <p className="mb-4 text-sm text-slate-600">Add at least two accounts in Settings → Banks, Wallets &amp; Cash to transfer funds.</p>}<form onSubmit={submit} className="grid gap-4">
      <Field label="Whose funds?"><select className={inputClass} value={person} onChange={event=>{setPerson(event.target.value as FundTransfer["person"]);setNotice("");setError("");}}><option>Ruru</option><option>Joselle</option></select></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From wallet"><select className={inputClass} required value={from} onChange={event=>{setFrom(event.target.value as PaymentMethod);setError("");setNotice("");}}><option value="" disabled>Select account</option>{transferMethods.map(method=><option key={method}>{method}</option>)}</select></Field>
        <Field label="To wallet"><select className={inputClass} required value={to} onChange={event=>{setTo(event.target.value as PaymentMethod);setError("");setNotice("");}}><option value="" disabled>Select account</option>{transferMethods.map(method=><option key={method} disabled={method===from}>{method}</option>)}</select></Field>
      </div>
      <div className="rounded-2xl bg-[#e7f5ff] p-4 text-sm"><p>Available in {from}: <strong>{formatCurrency(available)}</strong></p><p className="mt-1 text-slate-600">Current {to} balance: {formatCurrency(walletBalance(state,person,to))}</p></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Amount"><input className={inputClass} required type="number" min="0.01" step="0.01" value={amount} onChange={event=>setAmount(event.target.value)} placeholder="0.00" /></Field><Field label="Date"><input className={inputClass} required type="date" value={date} onChange={event=>setDate(event.target.value)} /></Field></div>
      <Field label="Comment (optional)"><input className={inputClass} value={notes} onChange={event=>setNotes(event.target.value)} /></Field>
      <p className="text-sm text-slate-500">Transfers update both wallets and keep total income, expenses, and savings unchanged.</p>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      <Button type="submit" className="w-fit" disabled={sync.isLoading || !from || !to || from===to || available<=0}><ArrowRightLeft size={17}/>Transfer funds</Button>
    </form></Panel>
    <Panel><h2 className="text-lg font-semibold">Transfer history</h2><div className="mt-4 grid gap-3">{history.map(transfer=><div key={transfer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ececf1] p-4"><div><p className="font-semibold">{transfer.fromMethod} → {transfer.toMethod}</p><p className="text-sm text-slate-500">{transfer.person} · {formatShortDate(transfer.date)}</p>{transfer.notes && <p className="mt-1 text-sm text-slate-600">{transfer.notes}</p>}</div><span className="font-semibold">{formatCurrency(transfer.amount)}</span></div>)}{!history.length && <EmptyState title="No transfers yet" description="Your wallet transfers will appear here." />}</div></Panel>
  </div>;
}
