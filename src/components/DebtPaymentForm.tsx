"use client";
import AmountInput from "./AmountInput";
import { useAmountPrivacy } from "@/src/context/AmountPrivacyContext";

import { useState } from "react";
import type { FormEvent } from "react";
import type { Debt } from "@/src/types/budget";
import { useBudget } from "@/src/context/BudgetContext";
import { getActiveCutoff, getWalletMethods, walletBalance } from "@/src/utils/finance";
import { Button, Field, inputClass } from "./ui";

export default function DebtPaymentForm({ debt }: { debt: Debt }) {
  const { formatCurrency } = useAmountPrivacy();
  const { state, actions } = useBudget();
  const methods = getWalletMethods(state);
  const [open, setOpen] = useState(false);
  const [person, setPerson] = useState<"Ruru" | "Joselle">("Ruru");
  const [method, setMethod] = useState(() => methods.includes("Cash") ? "Cash" : methods[0] || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");
  const available = walletBalance(state, person, method);
  const payment = Math.round(Number(amount) * 100) / 100;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    if (!Number.isFinite(payment) || payment <= 0) { setNotice("Enter a positive payment amount."); return; }
    if (payment > debt.remainingBalance) { setNotice("Payment cannot exceed the remaining debt."); return; }
    if (!methods.includes(method)) { setNotice("Select an available account."); return; }
    if (payment > available) { setNotice("This account does not have enough available balance."); return; }
    if (!date) { setNotice("Select the payment date."); return; }
    actions.recordDebtPayment({ debtId: debt.id, amount: payment, date, person, paymentMethod: method, paymentSource: person + " · " + method, cutoffId: getActiveCutoff(state).id, notes: notes.trim() });
    setAmount(""); setNotes(""); setOpen(false); setNotice("Payment recorded. Your debt and account balances have been updated.");
  };
  return <div className="mt-4">
    {debt.remainingBalance > 0 && !open && <Button onClick={() => { setNotice(""); setOpen(true); }}>Record Payment</Button>}
    {open && debt.remainingBalance > 0 && <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-[#c8e7ff] bg-[#f5fbff] p-4 sm:grid-cols-2">
      <p className="text-sm text-slate-600 sm:col-span-2">Pay this debt using money already in your account.</p>
      <Field label="Paid by"><select className={inputClass} value={person} onChange={e => setPerson(e.target.value as "Ruru" | "Joselle")}><option>Ruru</option><option>Joselle</option></select></Field>
      <Field label="Pay from account"><select className={inputClass} required value={method} onChange={e => setMethod(e.target.value)}><option value="" disabled>Select account</option>{methods.map(item => <option key={item}>{item}</option>)}</select></Field>
      <p className="text-sm sm:col-span-2">Available balance: <strong>{formatCurrency(available)}</strong></p>
      <Field label="Payment amount"><AmountInput className={inputClass} required type="number" min="0.01" max={debt.remainingBalance} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></Field>
      <Field label="Payment date"><input className={inputClass} required type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
      <Field label="Notes (optional)"><input className={inputClass} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2"><Button type="submit" confirm={"Record a payment of " + formatCurrency(payment || 0) + " for " + debt.name + " from " + person + " · " + method + "?"}>Save Payment</Button><Button variant="secondary" onClick={() => { setOpen(false); setNotice(""); }}>Cancel</Button></div>
    </form>}
    {notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
  </div>;
}
