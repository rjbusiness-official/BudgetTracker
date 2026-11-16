"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { BudgetState, Transaction } from "@/src/types/budget";
import { formatCurrency, formatShortDate } from "@/src/utils/finance";
import { transactionDetails } from "@/src/utils/transactionDetails";

export default function TransactionDetails({ state, transaction, onClose }: { state: BudgetState; transaction: Transaction; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const details = transactionDetails(state, transaction);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const fields = [
    ["Vendor / record", details.vendor],
    ["Amount", formatCurrency(transaction.amount)],
    ["Date", formatShortDate(transaction.date) + (transaction.date.includes("T") ? " · " + transaction.date.slice(11, 16) : "")],
    ["Paid by / account owner", details.person],
    ["Source wallet", details.wallet],
    ...(details.destination ? [["Destination wallet / allocation", details.destination]] : []),
    ...(details.payee ? [["Payee / recipient", details.payee]] : []),
    ["Type", transaction.type],
    ["Category", transaction.category],
    ["Comments", details.comments],
  ];
  return <dialog ref={dialog} aria-labelledby="transaction-details-title" onCancel={onClose} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-xl backdrop:bg-[#ded8ff]/55 backdrop:backdrop-blur-sm">
    <div className="mb-5 flex items-center justify-between gap-4"><h2 id="transaction-details-title" className="text-lg font-semibold">Transaction details</h2><button type="button" autoFocus aria-label="Close transaction details" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#249fff]"><X size={20} /></button></div>
    <dl className="grid gap-4 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className={label === "Comments" ? "sm:col-span-2" : ""}><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words font-medium">{value}</dd></div>)}</dl>
  </dialog>;
}
