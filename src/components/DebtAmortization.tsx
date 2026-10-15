"use client";

import type { Debt, DebtPayment } from "@/src/types/budget";
import { buildDebtAmortization } from "@/src/utils/debtPlan";
import { formatCurrency } from "@/src/utils/finance";
import { StatusBadge } from "@/src/components/ui";

function projectionStart(debt: Debt, payments: DebtPayment[]) {
  const latest = payments.map(payment => payment.date).sort().at(-1);
  if (!latest || latest < debt.dueDate.slice(0, 7) + "-01") return debt.dueDate;
  const paid = payments.filter(payment => payment.date.slice(0, 7) === latest.slice(0, 7)).reduce((sum, payment) => sum + payment.amount, 0);
  const [year, month] = latest.split("-").map(Number);
  const date = new Date(year, month - 1 + (Math.round(paid * 100) >= Math.round((debt.plannedPayment || debt.minimumPayment) * 100) ? 1 : 0), 1);
  const day = Math.min(Number(debt.dueDate.slice(8)), new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}

export default function DebtAmortization({ debt, payments }: { debt: Debt; payments: DebtPayment[] }) {
  const history = payments.filter(payment => payment.debtId === debt.id).slice().sort((a, b) => b.date.localeCompare(a.date));
  const schedule = buildDebtAmortization(debt, projectionStart(debt, history));
  const last = schedule.rows.at(-1);
  return <section className="mt-5 border-t border-slate-200 pt-4" aria-label={debt.name + " amortization"}>
    <h3 className="font-semibold">Monthly amortization breakdown</h3>
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      <div><p className="text-xs text-slate-500">Monthly payment</p><p className="font-semibold">{formatCurrency(debt.plannedPayment || debt.minimumPayment)}</p></div>
      <div><p className="text-xs text-slate-500">Remaining payments (estimated)</p><p className="font-semibold">{schedule.reason ? "Review payment plan" : schedule.rows.length}</p></div>
      <div><p className="text-xs text-slate-500">Estimated final due date</p><p className="font-semibold">{!schedule.reason && last ? last.dueDate : debt.remainingBalance === 0 ? "Paid off" : "Unavailable"}</p></div>
    </div>
    {schedule.reason ? <p role="status" className="mt-3 text-sm text-amber-800">{schedule.reason}</p> : null}
    {schedule.rows.length > 0 ? <div className="mt-3 max-h-96 overflow-auto rounded-2xl border border-slate-200"><table className="w-full whitespace-nowrap text-left text-sm"><caption className="sr-only">Estimated monthly amortization for {debt.name}</caption><thead className="sticky top-0 bg-[#f2eff8]"><tr>{["#", "Due date", "Opening balance", "Payment", "Interest", "Principal", "Remaining balance"].map(label => <th className="px-3 py-2" key={label}>{label}</th>)}</tr></thead><tbody>{schedule.rows.map(row => <tr className="border-t border-slate-100" key={row.installment}><td className="px-3 py-2">{row.installment}</td><td className="px-3 py-2">{row.dueDate}</td><td className="px-3 py-2">{formatCurrency(row.openingBalance)}</td><td className="px-3 py-2">{formatCurrency(row.payment)}</td><td className="px-3 py-2">{formatCurrency(row.interest)}</td><td className="px-3 py-2">{formatCurrency(row.principal)}</td><td className="px-3 py-2 font-medium">{formatCurrency(row.remainingBalance)}</td></tr>)}</tbody></table></div> : null}
    {!schedule.reason && schedule.rows.length > 0 ? <p className="mt-2 text-xs text-slate-500">Estimated total payments: {formatCurrency(schedule.totalPayments)} · Total interest: {formatCurrency(schedule.totalInterest)}</p> : null}
    <h4 className="mt-5 text-sm font-semibold">Recorded payments · {formatCurrency(history.reduce((sum, payment) => sum + payment.amount, 0))} paid</h4>
    {!history.length ? <p className="mt-2 text-sm text-slate-500">No payments recorded yet. Use Record Payment below to update this debt and your wallet.</p> : <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Paid on</th><th className="p-2">Amount</th><th className="p-2">Source</th><th className="p-2">Balance after recording</th></tr></thead><tbody>{history.map(payment => <tr key={payment.id} className="border-t border-slate-100"><td className="p-2">{payment.date}</td><td className="p-2">{formatCurrency(payment.amount)}</td><td className="p-2">{payment.paymentSource}</td><td className="p-2">{payment.balanceAfterPayment === undefined ? <span className="text-slate-500">Not captured</span> : formatCurrency(payment.balanceAfterPayment)}</td></tr>)}</tbody></table></div>}
    {debt.remainingBalance === 0 ? <div className="mt-3"><StatusBadge label="Paid off" tone="success" /></div> : null}
  </section>;
}
