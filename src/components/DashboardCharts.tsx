"use client";
import { useAmountPrivacy } from "@/src/context/AmountPrivacyContext";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BudgetState } from "@/src/types/budget";

import { incomeBreakdown } from "@/src/utils/incomeBreakdown";
import { Field, Panel, inputClass } from "./ui";

const colors = ["#249fff", "#c28afb"];
const incomeColors = ["#249fff", "#c28afb", "#43b99b"];
const monthLabel = (month: string) => new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" });

export default function DashboardCharts({ state }: { state: BudgetState }) {
  const { formatCurrency, hidden } = useAmountPrivacy();
  const months = Array.from(new Set([...state.incomes.map(item => item.date.slice(0, 7)), ...state.expenses.map(item => item.date.slice(0, 7)), ...(state.receivablePayments || []).map(item => item.date.slice(0, 7))])).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState("");
  const month = months.includes(selectedMonth) ? selectedMonth : months[0] || "";
  const income = state.incomes.filter(item => item.date.startsWith(month)).reduce((total, item) => total + item.amount, 0);
  const expenses = state.expenses.filter(item => item.date.startsWith(month)).reduce((total, item) => total + item.amount, 0);
  const total = income + expenses;
  const shares = [{ name: "Income", value: income }, { name: "Expenses", value: expenses }].map(item => ({ ...item, percentage: total > 0 ? item.value / total * 100 : 0 }));
  const sources = incomeBreakdown(state, month);
  const categoryTotals = new Map<string, number>();
  for (const item of state.expenses) categoryTotals.set(item.category || "Uncategorized", (categoryTotals.get(item.category || "Uncategorized") || 0) + item.amount);
  const categories = Array.from(categoryTotals, ([name, value]) => ({ name, value })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);
  const spending = categories.reduce((sum, item) => sum + item.value, 0);
  return <div className="grid min-w-0 gap-4 md:grid-cols-2">
    <Panel>
      <h2 className="text-lg font-semibold">Income and expenses by month</h2>
      <div className="mt-3"><Field label="Month"><select className={inputClass} value={month} disabled={!months.length} onChange={event => setSelectedMonth(event.target.value)}>{months.length ? months.map(value => <option key={value} value={value}>{monthLabel(value)}</option>) : <option value="">No records yet</option>}</select></Field></div>
      <div className="mt-4 grid min-w-0 gap-6 xl:grid-cols-2">
      <section className="min-w-0" aria-label="Income and expense shares">
      <p className="mt-3 text-xs text-slate-500">Percentage share of combined income and expenses for the selected month.</p>
      {total > 0 ? <>
        <ResponsiveContainer width="100%" height={240}><PieChart accessibilityLayer><Pie data={shares} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={2} labelLine={false} label={({ percent }) => Number(percent) > 0.04 ? (Number(percent) * 100).toFixed(1) + "%" : ""}>{shares.map((item, index) => <Cell key={item.name} fill={colors[index]} />)}</Pie><Tooltip formatter={value => { const amount = Number(value); return formatCurrency(amount) + " · " + (amount / total * 100).toFixed(1) + "%"; }} /></PieChart></ResponsiveContainer>
        <ul className="grid gap-3">{shares.map((item, index) => <li key={item.name} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index] }} />{item.name}</span><span className="font-semibold">{item.percentage.toFixed(1)}% <span className="font-normal text-slate-500">· {formatCurrency(item.value)}</span></span></li>)}</ul>
      </> : <p className="py-12 text-center text-sm text-slate-500">Record income or expenses to see the percentage breakdown.</p>}
      </section>
      <section className="min-w-0" aria-label="Income sources">
        <h3 className="text-sm font-semibold">Where income came from</h3>
        <p className="mt-3 text-xs text-slate-500">Percentage of income received this month. Receivables includes repayments received.</p>
        {sources.total > 0 ? <>
          <ResponsiveContainer width="100%" height={240}><PieChart accessibilityLayer><Pie data={sources.shares} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={2} labelLine={false} label={({ percent }) => Number(percent) > 0.04 ? (Number(percent) * 100).toFixed(1) + "%" : ""}>{sources.shares.map((item, index) => <Cell key={item.name} fill={incomeColors[index]} />)}</Pie><Tooltip formatter={value => formatCurrency(Number(value)) + " · " + (Number(value) / sources.total * 100).toFixed(1) + "%"} /></PieChart></ResponsiveContainer>
          <ul className="grid gap-3">{sources.shares.map((item, index) => <li key={item.name} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: incomeColors[index] }} />{item.name}</span><span className="font-semibold">{item.percentage.toFixed(1)}% <span className="font-normal text-slate-500">· {formatCurrency(item.value)}</span></span></li>)}</ul>
        </> : <p className="py-12 text-center text-sm text-slate-500">Record income or a receivable repayment to see income sources.</p>}
      </section>
      </div>
    </Panel>
    <Panel>
      <h2 className="text-lg font-semibold">Spending by expense type</h2>
      <p className="mt-2 text-xs text-slate-500">All recorded expenses, ranked from highest to lowest.</p>
      {categories.length ? <>
        <div className="mt-4 max-h-[420px] overflow-y-auto"><ResponsiveContainer width="100%" height={Math.max(240, categories.length * 48 + 35)}><BarChart accessibilityLayer layout="vertical" data={categories} margin={{ top: 5, right: 18, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="4 6" horizontal={false} stroke="#e8e8f0" /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={value => hidden ? formatCurrency(Number(value)) : new Intl.NumberFormat("en-PH", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value))} /><YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={110} tick={{ fontSize: 11 }} interval={0} /><Tooltip cursor={{ fill: "#f2f0fa" }} formatter={value => formatCurrency(Number(value)) + " · " + (Number(value) / spending * 100).toFixed(1) + "%"} /><Bar dataKey="value" name="Spending" fill="#c28afb" radius={[0, 6, 6, 0]} maxBarSize={26} /></BarChart></ResponsiveContainer></div>
        <p className="mt-3 text-sm text-slate-500">Total spending: <span className="font-semibold text-slate-900">{formatCurrency(spending)}</span></p>
      </> : <p className="py-12 text-center text-sm text-slate-500">Record expenses to see the breakdown.</p>}
    </Panel>
  </div>;
}
