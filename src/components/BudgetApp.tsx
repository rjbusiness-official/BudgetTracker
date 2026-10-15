"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowDown, ArrowUp, CalendarDays, CheckCircle, CreditCard, Heart, Landmark, LayoutDashboard, Settings, ChevronRight, LogOut, Pencil, PhilippinePeso, PiggyBank, Receipt, ShoppingCart, Target, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TodayExpenses, MoneyInWorkflow } from "./MoneyWorkflow";
import DebtAmortization from "@/src/components/DebtAmortization";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { BudgetProvider, useBudget } from "@/src/context/BudgetContext";
import type { Debt, WishlistItem } from "@/src/types/budget";
import { expenseTypes } from "@/src/utils/expenseTypes";
import { monthlyBillCategories } from "@/src/utils/monthlyBills";
import { salaryAllocationSummary, walletBalance, actualSpend, buildTransactions, debtProgress, formatCurrency, formatShortDate, getActiveCutoff, savingsProgress, totalIncome, totalSavings } from "@/src/utils/finance";
import { Button, EmptyState, Field, Modal, MoneyDisplay, PageHeader, Panel, ProgressBar, StatusBadge, SummaryCard, cn, inputClass } from "@/src/components/ui";

const chartColors = ["#249fff", "#c28afb", "#80e9f4", "#819fff", "#e3dcf6", "#acf5af", "#1e1e29"];

function getString(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

function getNumber(form: FormData, key: string) {
  return Number(form.get(key) || 0);
}

function todayInputValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return today.getFullYear() + "-" + month + "-" + day;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function useActiveFinance() {
  const { state, actions } = useBudget();
  const cutoff = getActiveCutoff(state);
  const debtPaid = sum(state.debtPayments.filter(payment => payment.cutoffId === cutoff.id).map(payment => payment.amount));
  return { state, actions, cutoff, debtPaid };
}

export default function BudgetApp() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <AppLoading />;
  }

  return (
    <AuthProvider>
      <BudgetProvider>
        <HashRouter>
          <AppShell />
        </HashRouter>
      </BudgetProvider>
    </AuthProvider>
  );
}

function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#6c63f6] text-white"><Wallet size={24} /></div>
        <h1 className="mt-4 text-xl font-semibold text-slate-950">Budget Tracker</h1>
        <p className="mt-2 text-sm text-slate-500">Loading your household budget workspace.</p>
      </div>
    </div>
  );
}

function AppShell() {
  const data = useActiveFinance();
  const { signOut } = useAuth();
  const location = useLocation();
  const showBack = location.pathname !== "/";
  return (
    <div
      className="min-h-screen bg-[#b9b0cc] p-3 text-[#1e1e29] md:p-6 lg:p-9"
      onWheelCapture={(event) => {
        // Release number inputs before the browser can step their value on scroll.
        if (event.target instanceof HTMLInputElement && event.target.type === "number") {
          event.target.blur();
        }
      }}
    >
      <div className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-[1600px] gap-5 rounded-[36px] bg-[#f0f0f2] p-2 lg:grid-cols-[235px_minmax(0,1fr)] lg:p-3">
        <aside className="flex flex-col rounded-[28px] bg-white p-4 lg:sticky lg:top-9 lg:h-[calc(100vh-96px)]">
          <NavLink to="/" className="flex items-center gap-2 px-1 py-5">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#c28afb] text-white"><Wallet size={23}/><span className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-[#80e9f4] ring-2 ring-white"/></span>
            <span className="text-lg font-bold tracking-tight text-[#191923]">Budget Tracker</span>
          </NavLink>
          <nav aria-label="Main navigation" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {([{to:"/dashboard",label:"Dashboard",icon:LayoutDashboard},{to:"/expenses",label:"Todays Expense",icon:Receipt},{to:"/income",label:"Money In",icon:PhilippinePeso},{to:"/settings",label:"Settings",icon:Settings}]).map(({to,label,icon:Icon})=><NavLink key={to} to={to} className={({isActive})=>cn("flex items-center gap-3 rounded-full px-4 py-3.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#249fff]",isActive || (to==="/settings" && ["/bills","/debts","/wishlist","/expense-types"].includes(location.pathname))?"bg-[#1e1e29] text-white":"text-[#4e5263] hover:bg-[#f2f0fa]")}><Icon size={20} strokeWidth={1.6}/><span>{label}</span></NavLink>)}
          </nav>
          <div className="mt-auto hidden pt-10 lg:block"><div className="rounded-[24px] bg-[#e3dcf6] p-5"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-[#7956b5]"><Heart size={22}/></span><h2 className="mt-4 text-lg font-semibold">Building a future.</h2><p className="mt-2 text-sm leading-6 text-[#5d5573]">Budgeting isn’t about limiting yourself — it’s about making the things that excite you possible.</p><NavLink to="/income" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">plan your salary <ChevronRight size={16}/></NavLink></div></div>
        </aside>
        <div className="min-w-0 px-1 py-1 lg:px-0">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[26px] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(30,30,40,0.04)]">
            <div className="flex items-center gap-3">{showBack ? <BackToChoices /> : <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f1f1f3]"><CalendarDays size={20}/></span>}<p className="text-sm text-[#696979]">{new Intl.DateTimeFormat("en-PH",{weekday:"short",month:"short",day:"numeric",year:"numeric",timeZone:"Asia/Manila"}).format(new Date())}</p></div>
            <div className="flex items-center gap-3"><span className="hidden text-sm font-medium sm:block">{data.state.profile.husbandName} & {data.state.profile.wifeName}</span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3dcf6] text-sm font-semibold" aria-hidden="true">{data.state.profile.husbandName.slice(0,1)}{data.state.profile.wifeName.slice(0,1)}</span><Button variant="ghost" onClick={() => void signOut()}><LogOut size={17} /> Sign out</Button></div>
          </header>
          <main className="min-w-0 pb-3">
          <Routes>
            <Route path="/" element={<ActionHomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/income" element={<MoneyInWorkflow />} />
            <Route path="/expenses" element={<TodayExpenses />} />
            <Route path="/expense-history" element={<ExpensesPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/debts" element={<DebtsPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/transactions" element={<TransactionHistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/expense-types" element={<ExpenseTypesSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

function ActionHomePage() {
  const data = useActiveFinance();
  return (
    <div className="mx-auto w-full max-w-4xl">
      <section className="overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_8px_30px_rgba(30,30,40,0.04)]">
        <div className="h-2 bg-[#e3dcf6]" />
        <div className="border-b border-slate-200 px-6 py-5">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Money Tracker</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{data.state.profile.husbandName} and {data.state.profile.wifeName}</p>
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2">
          <HomeActionLink to="/expenses" label="Todays Expense" icon={Receipt} tone="danger" />
          <HomeActionLink to="/income" label="Money In" icon={PhilippinePeso} tone="success" />
          <HomeActionLink to="/dashboard" label="Dashboard" icon={LayoutDashboard} tone="accent" className="sm:col-span-2" />
        </div>
      </section>
    </div>
  );
}

function HomeActionLink({ to, label, icon: Icon, tone, className }: { to: string; label: string; icon: LucideIcon; tone: "success" | "danger" | "accent"; className?: string }) {
  const toneClass = {
    success: "border-transparent bg-[#e7f5ff] text-[#1676ba] hover:bg-[#d7eeff]",
    danger: "border-transparent bg-[#e3dcf6] text-[#65518c] hover:bg-[#d8ceef]",
    accent: "border-transparent bg-[#1e1e29] text-white hover:bg-[#343442]"
  }[tone];
  return (
    <NavLink to={to} className={cn("flex min-h-20 items-center justify-center gap-3 rounded-[22px] border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#249fff]/30", toneClass, className)}>
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

function BackToChoices() {
  const { pathname } = useLocation();
  const isSettingsPage = ["/bills", "/debts", "/wishlist", "/expense-types"].includes(pathname);
  return (
    <NavLink to={isSettingsPage ? "/settings" : "/"} className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-full border border-transparent bg-[#f1f1f3] px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#249fff]/30">
      <ArrowLeft size={17} />
      <span>{isSettingsPage ? "Back to Settings" : "Back"}</span>
    </NavLink>
  );
}

function DashboardPage() {
  const { state } = useBudget();
  const balance = sum((["Ruru", "Joselle"] as const).flatMap(person => walletMethods.map(method => walletBalance(state, person, method))));
  return <div className="mx-auto grid max-w-4xl gap-4">
    <PageHeader title="Financial Summary" description="Track income, spending, wallets, and savings." actions={<NavLink to="/settings" className="rounded-md border bg-white px-4 py-2 text-sm font-semibold text-violet-700">Settings</NavLink>} />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard label="Money In" value={formatCurrency(totalIncome(state.incomes))} icon={TrendingUp} tone="success" />
      <SummaryCard label="Money Out" value={formatCurrency(actualSpend(state.expenses))} icon={TrendingDown} tone="danger" />
      <SummaryCard label="Available Balance" value={formatCurrency(balance)} helper="After allocations, expenses, debt payments, and savings" icon={Wallet} />
      <SummaryCard label="Savings" value={formatCurrency(totalSavings(state))} icon={PiggyBank} tone="accent" />
    </div>
    <div className="grid gap-4 md:grid-cols-2"><ChartPanel title="Income and expenses by month"><ResponsiveContainer width="100%" height={260}><BarChart data={Array.from(new Set([...state.incomes.map(i=>i.date.slice(0,7)),...state.expenses.map(e=>e.date.slice(0,7))])).sort().slice(-6).map(month=>({month,income:sum(state.incomes.filter(i=>i.date.startsWith(month)).map(i=>i.amount)),expenses:sum(state.expenses.filter(e=>e.date.startsWith(month)).map(e=>e.amount))}))}><CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#e8e8f0"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} width={55}/><Tooltip formatter={v=>formatCurrency(Number(v))}/><Bar dataKey="income" name="Income" fill="#249fff" radius={[10,10,10,10]}/><Bar dataKey="expenses" name="Expenses" fill="#c28afb" radius={[10,10,10,10]}/></BarChart></ResponsiveContainer></ChartPanel><ChartPanel title="Spending by expense type"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={Array.from(new Set(state.expenses.map(e=>e.category))).map(name=>({name,value:sum(state.expenses.filter(e=>e.category===name).map(e=>e.amount))}))} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} label>{Array.from(new Set(state.expenses.map(e=>e.category))).map((name,i)=><Cell key={name} fill={chartColors[i%chartColors.length]}/>)}</Pie><Tooltip formatter={v=>formatCurrency(Number(v))}/></PieChart></ResponsiveContainer>{!state.expenses.length&&<p className="text-sm text-slate-500">Record expenses to see the breakdown.</p>}</ChartPanel></div>
    <Panel>
      <h2 className="text-lg font-semibold">Salary allocations</h2>
      <p className="mt-1 text-sm text-slate-500">Allocations are automatically deducted from the available balance when you save your salary.</p>
      <div className="mt-4 grid gap-4">{state.incomes.filter(income => income.type === "Salary" || income.source === "Salary").slice().sort((a,b) => b.date.localeCompare(a.date)).map(income => {
        const summary = salaryAllocationSummary(state, income.id);
        const allocations = state.salaryAllocations.filter(item => item.incomeId === income.id);
        const payments = state.debtPayments.filter(item => item.incomeId === income.id);
        return <div key={income.id} className="rounded-2xl border border-[#ececf1] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{income.person === "Husband" ? "Ruru" : income.person === "Wife" ? "Joselle" : "Shared Money"} · {formatShortDate(income.date)}</h3><span className="text-sm">Salary {formatCurrency(income.amount)}</span></div>
          <div className="mt-3 grid gap-2 text-sm">{allocations.map(item => <MoneyRow key={item.id} label={item.category.replace(/^(bill:|wish:)/, "")} value={item.amount}/>)}{payments.map(payment => <MoneyRow key={payment.id} label={(state.debts.find(debt => debt.id === payment.debtId)?.name || "Debt") + " payment"} value={payment.amount}/>)}<MoneyRow label="Total allocated" value={summary.allocated} strong/><MoneyRow label="Salary remaining after allocation" value={summary.remaining}/></div>
        </div>;
      })}</div>
      {!state.incomes.some(income => income.type === "Salary" || income.source === "Salary") && <p className="mt-3 text-sm text-slate-500">Save a salary allocation to see the breakdown here.</p>}
    </Panel>
    <WalletBalances />
    <Panel><h2 className="text-lg font-semibold">Recent activity</h2><div className="mt-4 grid gap-2">{buildTransactions(state).slice(0,12).map(t => <LedgerRow key={t.id} left={t.description} meta={formatShortDate(t.date) + " | " + t.type + " | " + t.person} amount={t.amount} />)}{!buildTransactions(state).length ? <EmptyState title="No activity yet" description="Start by recording Money In." /> : null}</div><NavLink to="/transactions" className="mt-4 inline-block text-sm font-semibold text-violet-700">View all activity</NavLink></Panel>
  </div>;
}

function MoneyRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <div className={cn("flex items-center justify-between gap-4", strong && "border-t border-slate-200 pt-3 font-semibold")}><span>{label}</span><MoneyDisplay value={value} /></div>;
}

function LedgerRow({ left, meta, amount, action }: { left: string; meta: string; amount: number; action?: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ececf1] p-4"><div><p className="font-semibold">{left}</p><p className="text-sm text-slate-500">{meta}</p></div><div className="flex items-center gap-2"><p className="font-semibold"><MoneyDisplay value={amount} /></p>{action}</div></div>;
}

const walletMethods = ["Cash", "GCash", "Maya", "BDO", "GoTyme", "Bank Transfer", "Debit Card", "Credit Card", "Other"] as const;



function WalletBalances() {
  const { state } = useBudget();
  return <Panel><h2 className="text-lg font-semibold">Your wallets</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{(["Ruru", "Joselle"] as const).map(person => <div key={person}><h3 className="mb-2 font-semibold">{person}</h3>{walletMethods.map(method => <MoneyRow key={method} label={method} value={walletBalance(state, person, method)} />)}</div>)}</div>{state.incomes.some(i => !i.paymentMethod) ? <p className="mt-3 text-sm text-slate-500">Older income without a payment source is not assigned to a wallet.</p> : null}</Panel>;
}

function ExpensesPage() {
 const { state, actions } = useBudget();
 return <div className="mx-auto grid max-w-4xl gap-4"><PageHeader title="Expense history" description="Review expenses recorded through Todays Expense." actions={<NavLink to="/expenses" className="text-sm font-semibold text-violet-700">Record expenses</NavLink>}/><Panel><div className="grid gap-3">{[...state.expenses].sort((a,b)=>b.date.localeCompare(a.date)).map(expense=><LedgerRow key={expense.id} left={expense.name} meta={[expense.payeeName,formatShortDate(expense.date),expense.category,expense.paidBy,expense.paymentMethod].filter(Boolean).join(" | ")} amount={expense.amount} action={<Button variant="ghost" onClick={()=>actions.deleteExpense(expense.id)} title="Delete expense"><Trash2 size={16}/></Button>}/>)}{!state.expenses.length&&<EmptyState title="No expenses yet" description="Record an expense to see it here."/>}</div></Panel></div>;
}



function BillsPage() {
  const { state, actions } = useBudget();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const categories = monthlyBillCategories(state);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const category = name.trim();
    if (!category) { setError("Enter a category name."); return; }
    if (categories.some(item => item.toLowerCase() === category.toLowerCase())) { setError("This category is already listed."); return; }
    actions.setMonthlyBillCategories([...categories, category]);
    setName("");
    setError("");
  };
  return <div className="mx-auto grid max-w-3xl gap-5">
    <PageHeader title="Monthly Allocation Bills" description="Manage the bill categories used when you allocate your salary." />
    <Panel>
      <ul className="divide-y divide-[#ececf1]">{categories.map(category => <li key={category} className="flex items-center justify-between gap-3 py-3"><span className="font-medium">{category}</span><Button variant="ghost" title={"Remove " + category} onClick={() => actions.setMonthlyBillCategories(categories.filter(item => item !== category))}><Trash2 size={16} /><span className="sr-only">Remove {category}</span></Button></li>)}</ul>
      {!categories.length && <p className="py-3 text-sm text-slate-500">No categories yet. Add one below.</p>}
      <form onSubmit={submit} className="mt-5 flex flex-col items-stretch gap-3 border-t border-[#ececf1] pt-5 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1"><Field label="New category"><input className={inputClass} required maxLength={80} value={name} onChange={event => {setName(event.target.value);setError("");}} placeholder="e.g. Rent" /></Field></div>
        <Button type="submit" className="w-fit shrink-0">Add category</Button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    </Panel>
  </div>;
}

function DebtsPage() {
  const data = useActiveFinance();
  const [editing, setEditing] = useState<Debt | null>(null);
  const totalOriginal = sum(data.state.debts.map((debt) => debt.originalAmount));
  const totalRemaining = sum(data.state.debts.map((debt) => debt.remainingBalance));
  return <div className="grid gap-6"><PageHeader title="Debt settings" description="Manage debts and monthly payment amounts for the salary workflow." /><div className="grid gap-4 md:grid-cols-4"><SummaryCard label="Original Debt" value={formatCurrency(totalOriginal)} icon={CreditCard} /><SummaryCard label="Remaining Debt" value={formatCurrency(totalRemaining)} icon={Landmark} tone="warning" /><SummaryCard label="Total Paid" value={formatCurrency(totalOriginal - totalRemaining)} icon={TrendingDown} tone="success" /><SummaryCard label="Payments This Cutoff" value={formatCurrency(data.debtPaid)} icon={CheckCircle} /></div><Panel><DebtForm key={editing?.id || "new-debt"} initial={editing} onDone={() => setEditing(null)} /></Panel><Panel><div className="grid gap-4">{data.state.debts.map((debt) => <div key={debt.id} className="rounded-[22px] border border-[#ececf1] p-5"><div className="flex items-start justify-between"><div><p className="font-semibold">{debt.name}</p><p className="text-sm text-slate-500">{debt.creditor} | Due {formatShortDate(debt.dueDate)}</p></div><StatusBadge label={debt.type} tone="accent" /></div><div className="mt-4 grid gap-2 text-sm"><MoneyRow label="Original" value={debt.originalAmount} /><MoneyRow label="Remaining" value={debt.remainingBalance} /><MoneyRow label="Planned Payment" value={debt.plannedPayment} /></div><div className="mt-3"><ProgressBar value={debtProgress(debt)} tone="success" /></div><p className="mt-2 text-sm text-slate-500">{debtProgress(debt).toFixed(0)}% paid</p><DebtAmortization debt={debt} payments={data.state.debtPayments} /><div className="mt-3 flex gap-2"><Button variant="ghost" onClick={() => setEditing(debt)} title="Edit debt"><Pencil size={16} /></Button><Button variant="ghost" onClick={() => data.actions.deleteDebt(debt.id)} title="Delete debt"><Trash2 size={16} /></Button></div></div>)}</div></Panel></div>;
}

function DebtForm({ initial, onDone }: { initial?: Debt | null; onDone: () => void }) {
  const data = useActiveFinance();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { name: getString(form, "name"), creditor: getString(form, "creditor"), type: getString(form, "type") as Debt["type"], originalAmount: getNumber(form, "originalAmount"), remainingBalance: getString(form, "remainingBalance") ? getNumber(form, "remainingBalance") : getNumber(form, "originalAmount"), minimumPayment: getNumber(form, "minimumPayment"), plannedPayment: getNumber(form, "plannedPayment"), interestRate: getNumber(form, "interestRate"), interestRatePeriod: getString(form, "interestRatePeriod") as "Annual" | "Monthly", dueDate: getString(form, "dueDate"), assignedCutoffId: initial?.assignedCutoffId || data.cutoff.id, notes: getString(form, "notes") };
    data.actions.upsertDebt(initial ? { ...payload, id: initial.id } : payload);
    event.currentTarget.reset();
    onDone();
  };
  return <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}><Field label="Debt Name"><input className={inputClass} name="name" required defaultValue={initial?.name || ""} /></Field><Field label="Creditor"><select className={inputClass} name="creditor" required defaultValue={initial?.creditor === "Ruru" || initial?.creditor === "Joselle" ? initial.creditor : ""}><option value="" disabled>Select creditor</option><option value="Ruru">Ruru</option><option value="Joselle">Joselle</option></select></Field><Field label="Debt Type"><select className={inputClass} name="type" defaultValue={initial?.type || "Credit Card"}><option>Credit Card</option><option>Personal Loan</option><option>Car Loan</option><option>Home Loan</option><option>Installment</option><option>Borrowed Money</option><option>Other</option></select></Field><Field label="Original Amount"><input className={inputClass} name="originalAmount" type="number" min="0.01" step="0.01" required defaultValue={initial?.originalAmount || ""} /></Field><Field label="Remaining Balance" hint="Leave blank to start with the original amount."><input className={inputClass} name="remainingBalance" type="number" min="0" step="0.01" defaultValue={initial?.remainingBalance ?? ""} /></Field><Field label="Monthly minimum payment"><input className={inputClass} name="minimumPayment" type="number" min="0" step="0.01" required defaultValue={initial?.minimumPayment || ""} /></Field><Field label="Preferred monthly payment"><input className={inputClass} name="plannedPayment" type="number" min="0" step="0.01" required defaultValue={initial?.plannedPayment || ""} /></Field><Field label="Interest rate (%)"><input className={inputClass} name="interestRate" type="number" min="0" step="0.01" defaultValue={initial?.interestRate || 0} /></Field><Field label="Rate period"><select className={inputClass} name="interestRatePeriod" defaultValue={initial?.interestRatePeriod || "Annual"}><option>Annual</option><option>Monthly</option></select></Field><Field label="First due date" hint="Repeats monthly on this day."><input className={inputClass} name="dueDate" type="date" required defaultValue={initial?.dueDate || todayInputValue()} /></Field><Field label="Notes"><input className={inputClass} name="notes" defaultValue={initial?.notes || ""} /></Field><div className="md:col-span-4 flex gap-2"><Button type="submit"><CheckCircle size={17} /> {initial ? "Save Debt" : "Add Debt"}</Button>{initial ? <Button variant="secondary" onClick={onDone}>Cancel</Button> : null}</div></form>;
}

function WishlistPage() {
  const data = useActiveFinance();
  const [editing, setEditing] = useState<WishlistItem | null>(null);
  return <div className="grid gap-6"><PageHeader title="Wishlist settings" description="Manage goals available in your salary allocation workflow." /><Panel><WishlistForm key={editing?.id || "new-wish"} initial={editing} onDone={() => setEditing(null)} /></Panel><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.state.wishlistItems.map((item) => <Panel key={item.id}><div className="flex items-start justify-between"><div><h2 className="font-semibold">{item.name}</h2><p className="text-sm text-slate-500">{item.priority} priority | {item.status}</p></div><ShoppingCart className="text-[#6c63f6]" size={22} /></div><div className="mt-4 grid gap-2 text-sm"><MoneyRow label="Estimated" value={item.estimatedCost} /><MoneyRow label="Saved" value={item.amountSaved} /><MoneyRow label="Per Cutoff" value={item.plannedContributionPerCutoff} />{item.actualCost ? <MoneyRow label={item.actualCost <= item.estimatedCost ? "Saved vs plan" : "Overspent vs plan"} value={Math.abs(item.estimatedCost - item.actualCost)} /> : null}</div><div className="mt-3"><ProgressBar value={savingsProgress(item.amountSaved, item.estimatedCost)} tone="accent" /></div><div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => data.actions.markWishlistPurchased(item.id, item.estimatedCost)} disabled={item.status === "Purchased"}><CheckCircle size={16} /> Mark Purchased</Button><Button variant="ghost" onClick={() => setEditing(item)} title="Edit item"><Pencil size={16} /></Button><Button variant="ghost" onClick={() => data.actions.deleteWishlistItem(item.id)} title="Delete item"><Trash2 size={16} /></Button></div></Panel>)}</div></div>;
}

function WishlistForm({ initial, onDone }: { initial?: WishlistItem | null; onDone: () => void }) {
  const data = useActiveFinance();
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const payload = { name: getString(form, "name"), estimatedCost: getNumber(form, "estimatedCost"), priority: getString(form, "priority") as WishlistItem["priority"], targetPurchaseDate: getString(form, "targetPurchaseDate"), amountSaved: getNumber(form, "amountSaved"), plannedContributionPerCutoff: getNumber(form, "plannedContributionPerCutoff"), status: getString(form, "status") as WishlistItem["status"], actualCost: getNumber(form, "actualCost") || undefined, notes: getString(form, "notes") }; data.actions.upsertWishlistItem(initial ? { ...payload, id: initial.id } : payload); event.currentTarget.reset(); onDone(); };
  return <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}><Field label="Item Name"><input className={inputClass} name="name" required defaultValue={initial?.name || ""} /></Field><Field label="Estimated Cost"><input className={inputClass} name="estimatedCost" type="number" min="0.01" step="0.01" required defaultValue={initial?.estimatedCost || ""} /></Field><Field label="Priority"><select className={inputClass} name="priority" defaultValue={initial?.priority || "Medium"}><option>High</option><option>Medium</option><option>Low</option></select></Field><Field label="Target Date"><input className={inputClass} name="targetPurchaseDate" type="date" required defaultValue={initial?.targetPurchaseDate || data.cutoff.payday} /></Field><Field label="Amount Saved"><input className={inputClass} name="amountSaved" type="number" min="0" step="0.01" defaultValue={initial?.amountSaved || 0} /></Field><Field label="Contribution / Cutoff"><input className={inputClass} name="plannedContributionPerCutoff" type="number" min="0" step="0.01" defaultValue={initial?.plannedContributionPerCutoff || 0} /></Field><Field label="Status"><select className={inputClass} name="status" defaultValue={initial?.status || "Planning"}><option>Planning</option><option>Saving</option><option>Ready to Buy</option><option>Purchased</option><option>Cancelled</option></select></Field><Field label="Actual Cost"><input className={inputClass} name="actualCost" type="number" min="0" step="0.01" defaultValue={initial?.actualCost || ""} /></Field><Field label="Notes"><input className={inputClass} name="notes" defaultValue={initial?.notes || ""} /></Field><div className="flex flex-wrap items-end gap-2 md:col-span-3"><Button type="submit" className="w-fit shrink-0"><CheckCircle size={17} /> {initial ? "Save Item" : "Add Item"}</Button>{initial ? <Button variant="secondary" onClick={onDone}>Cancel</Button> : null}</div></form>;
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <Panel><h2 className="text-lg font-semibold">{title}</h2><div className="mt-4">{children}</div></Panel>;
}

function TransactionHistoryPage() {
  const data = useActiveFinance();
  const transactions = buildTransactions(data.state);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [cutoff, setCutoff] = useState(data.cutoff.id);
  const filtered = transactions.filter((transaction) => (type === "All" || transaction.type === type) && (cutoff === "All" || transaction.cutoffId === cutoff) && (transaction.description.toLowerCase().includes(query.toLowerCase()) || transaction.category.toLowerCase().includes(query.toLowerCase())));
  return <div className="grid gap-6"><PageHeader title="Transaction History" description="Centralized ledger across income, expenses, bill payments, debt payments, and savings movements." /><Panel><div className="grid gap-3 md:grid-cols-3"><input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ledger" /><select className={inputClass} value={type} onChange={(event) => setType(event.target.value)}><option>All</option><option>Income</option><option>Salary Allocation</option><option>Expense</option><option>Bill Payment</option><option>Debt Payment</option><option>Savings Contribution</option><option>Savings Withdrawal</option></select><select className={inputClass} value={cutoff} onChange={(event) => setCutoff(event.target.value)}><option value="All">All Cutoffs</option>{data.state.cutoffs.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div><div className="mt-4 grid gap-2">{filtered.map((transaction) => <div key={transaction.id} className="grid gap-2 rounded-2xl border border-[#ececf1] p-4 md:grid-cols-[140px_1fr_170px_130px]"><p className="text-sm text-slate-500">{formatShortDate(transaction.date)}</p><div><p className="font-semibold">{transaction.description}</p><p className="text-sm text-slate-500">{transaction.category} | {transaction.person}</p></div><StatusBadge label={transaction.type} tone={transaction.type === "Income" ? "success" : transaction.type.includes("Savings") ? "accent" : transaction.type.includes("Debt") ? "warning" : "neutral"} /><p className="text-right font-semibold"><MoneyDisplay value={transaction.amount} /></p></div>)}</div></Panel></div>;
}

function ExpenseTypesSettings() {
  const { state, actions } = useBudget();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const types = expenseTypes(state);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const type = name.trim();
    if (!type) { setError("Enter an expense type."); return; }
    if (types.some(item => item.toLowerCase() === type.toLowerCase())) { setError("This expense type is already listed."); return; }
    actions.setExpenseTypes([...types, type]);
    setName(""); setError("");
  };
  return <div className="mx-auto grid max-w-3xl gap-5">
    <PageHeader title="Expense Types" description="Choose the types available in Todays Expense. Removing a type keeps past expenses unchanged." />
    <Panel>
    <ul className="mt-3 divide-y divide-[#ececf1]">{types.map(type => <li key={type} className="flex items-center justify-between gap-3 py-2"><span>{type}</span><Button variant="ghost" title={"Remove " + type} onClick={() => actions.setExpenseTypes(types.filter(item => item !== type))}><Trash2 size={16}/><span className="sr-only">Remove {type}</span></Button></li>)}</ul>
    {!types.length && <p className="mt-3 text-sm text-slate-500">No expense types yet. Add a type before recording expenses.</p>}
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3 border-t border-[#ececf1] pt-4 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1"><Field label="New expense type"><input className={inputClass} required maxLength={80} placeholder="e.g. Groceries" value={name} onChange={event => {setName(event.target.value);setError("");}}/></Field></div>
      <Button type="submit" className="w-fit shrink-0">Add type</Button>
    </form>
    {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    </Panel>
  </div>;
}

function SettingsPage() {
  const data = useActiveFinance();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState("");
  const closeReset = () => {
    if (resetting) return;
    setResetOpen(false); setResetPassword(""); setResetError("");
  };
  const confirmReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (resetting) return;
    setResetting(true); setResetError("");
    try {
      await data.actions.resetDemoData(resetPassword);
      setResetOpen(false); setResetPassword("");
      setResetNotice("All budget data has been reset.");
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Unable to verify your password. Please try again.");
    } finally { setResetting(false); }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data.state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "budget-tracker-data.json";
    link.click();
    URL.revokeObjectURL(url);
  };
  const importData = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        data.actions.importData(JSON.parse(String(reader.result)));
      } catch {
        window.alert("Import failed. Please choose a valid exported JSON file.");
      }
    };
    reader.readAsText(file);
  };
  return <div className="grid gap-6"><PageHeader title="Settings" description="Manage expense types, monthly bill allocations, debts, wishlist goals, and your saved budget data." /><Panel><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"><HomeActionLink to="/bills" label="Monthly Allocation Bills" icon={CalendarDays} tone="accent"/><HomeActionLink to="/debts" label="List of debts" icon={CreditCard} tone="accent"/><HomeActionLink to="/wishlist" label="List of wishlist" icon={Target} tone="accent"/><HomeActionLink to="/expense-types" label="Expense Types" icon={Receipt} tone="accent"/></div></Panel><Panel><h2 className="text-lg font-semibold">Data Management</h2><p className="mt-1 text-sm text-slate-500">Budget data syncs to Supabase after login and keeps a local cache on this device.</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={exportData}><ArrowDown size={17} /> Export Data</Button><Button variant="secondary" onClick={() => fileInputRef.current?.click()}><ArrowUp size={17} /> Import Data</Button><Button variant="danger" onClick={() => {setResetNotice("");setResetError("");setResetPassword("");setResetOpen(true);}}><Trash2 size={17} /> Reset All Data</Button></div><input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(event) => importData(event.target.files?.[0])} /></Panel>
    {resetNotice && <p role="status" className="text-sm text-emerald-700">{resetNotice}</p>}
    {resetOpen && <Modal title="Reset All Data" onClose={closeReset}>
      <form onSubmit={confirmReset} className="grid gap-4" aria-busy={resetting}>
        <p className="text-sm leading-6 text-slate-600">This clears all budget records and custom settings. Enter your account login password to confirm.</p>
        <Field label="Account login password"><input className={inputClass} type="password" name="resetPassword" autoComplete="current-password" required autoFocus disabled={resetting} value={resetPassword} onChange={event => setResetPassword(event.target.value)} /></Field>
        {resetError && <p role="alert" className="text-sm text-rose-700">{resetError}</p>}
        <div className="flex flex-wrap justify-end gap-2"><Button variant="secondary" disabled={resetting} onClick={closeReset}>Cancel</Button><Button variant="danger" type="submit" disabled={resetting || !resetPassword}>{resetting ? "Verifying password…" : "Reset All Data"}</Button></div>
      </form>
    </Modal>}
  </div>;
}
