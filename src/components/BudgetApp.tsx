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
import type { Bill, Debt, Expense, PaymentMethod, WishlistItem } from "@/src/types/budget";
import { walletBalance, actualSpend, billStatus, buildTransactions, debtProgress, formatCurrency, formatShortDate, getActiveCutoff, savingsProgress, totalIncome, totalSavings, upcomingBills } from "@/src/utils/finance";
import { Button, EmptyState, Field, MoneyDisplay, PageHeader, Panel, ProgressBar, StatusBadge, SummaryCard, cn, inputClass } from "@/src/components/ui";

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
            {([{to:"/dashboard",label:"Dashboard",icon:LayoutDashboard},{to:"/expenses",label:"Todays Expense",icon:Receipt},{to:"/income",label:"Money In",icon:PhilippinePeso},{to:"/settings",label:"Settings",icon:Settings}]).map(({to,label,icon:Icon})=><NavLink key={to} to={to} className={({isActive})=>cn("flex items-center gap-3 rounded-full px-4 py-3.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#249fff]",isActive || (to==="/settings" && ["/bills","/debts","/wishlist"].includes(location.pathname))?"bg-[#1e1e29] text-white":"text-[#4e5263] hover:bg-[#f2f0fa]")}><Icon size={20} strokeWidth={1.6}/><span>{label}</span></NavLink>)}
          </nav>
          <div className="mt-auto hidden pt-10 lg:block"><div className="rounded-[24px] bg-[#e3dcf6] p-5"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-[#7956b5]"><Heart size={22}/></span><h2 className="mt-4 text-lg font-semibold">Better together.</h2><p className="mt-2 text-sm leading-6 text-[#5d5573]">A little planning today. More room for the things you love.</p><NavLink to="/income" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Plan your salary <ChevronRight size={16}/></NavLink></div></div>
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
  const isSettingsPage = ["/bills", "/debts", "/wishlist"].includes(pathname);
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
      <SummaryCard label="Wallet Balance" value={formatCurrency(balance)} icon={Wallet} />
      <SummaryCard label="Savings" value={formatCurrency(totalSavings(state))} icon={PiggyBank} tone="accent" />
    </div>
    <div className="grid gap-4 md:grid-cols-2"><ChartPanel title="Income and expenses by month"><ResponsiveContainer width="100%" height={260}><BarChart data={Array.from(new Set([...state.incomes.map(i=>i.date.slice(0,7)),...state.expenses.map(e=>e.date.slice(0,7))])).sort().slice(-6).map(month=>({month,income:sum(state.incomes.filter(i=>i.date.startsWith(month)).map(i=>i.amount)),expenses:sum(state.expenses.filter(e=>e.date.startsWith(month)).map(e=>e.amount))}))}><CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#e8e8f0"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} width={55}/><Tooltip formatter={v=>formatCurrency(Number(v))}/><Bar dataKey="income" name="Income" fill="#249fff" radius={[10,10,10,10]}/><Bar dataKey="expenses" name="Expenses" fill="#c28afb" radius={[10,10,10,10]}/></BarChart></ResponsiveContainer></ChartPanel><ChartPanel title="Spending by expense type"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={Array.from(new Set(state.expenses.map(e=>e.category))).map(name=>({name,value:sum(state.expenses.filter(e=>e.category===name).map(e=>e.amount))}))} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} label>{Array.from(new Set(state.expenses.map(e=>e.category))).map((name,i)=><Cell key={name} fill={chartColors[i%chartColors.length]}/>)}</Pie><Tooltip formatter={v=>formatCurrency(Number(v))}/></PieChart></ResponsiveContainer>{!state.expenses.length&&<p className="text-sm text-slate-500">Record expenses to see the breakdown.</p>}</ChartPanel></div>
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

const walletMethods = ["Cash", "GCash", "Maya", "BDO", "GoTyme"] as const;

function MoneyTypeFields({ initial }: { initial?: PaymentMethod }) {
  const [kind, setKind] = useState(initial && initial !== "Cash" ? "Digital" : "Cash");
  return <>
    <FormQuestion label="Type of money"><select className={inputClass} value={kind} onChange={e => setKind(e.target.value)}><option value="Cash">Cash</option><option value="Digital">Digital money</option></select></FormQuestion>
    {kind === "Digital" ? <FormQuestion label="Bank or wallet"><select className={inputClass} name="paymentMethod" required defaultValue={initial && walletMethods.includes(initial as typeof walletMethods[number]) && initial !== "Cash" ? initial : ""}><option value="" disabled>Choose bank or wallet</option>{walletMethods.filter(m => m !== "Cash").map(m => <option key={m}>{m}</option>)}</select></FormQuestion> : <input type="hidden" name="paymentMethod" value="Cash" />}
  </>;
}

function WalletBalances() {
  const { state } = useBudget();
  return <Panel><h2 className="text-lg font-semibold">Your wallets</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{(["Ruru", "Joselle"] as const).map(person => <div key={person}><h3 className="mb-2 font-semibold">{person}</h3>{walletMethods.map(method => <MoneyRow key={method} label={method} value={walletBalance(state, person, method)} />)}</div>)}</div>{state.incomes.some(i => !i.paymentMethod) ? <p className="mt-3 text-sm text-slate-500">Older income without a payment source is not assigned to a wallet.</p> : null}</Panel>;
}

function ExpensesPage() {
 const { state, actions } = useBudget();
 return <div className="mx-auto grid max-w-4xl gap-4"><PageHeader title="Expense history" description="Review expenses recorded through Todays Expense." actions={<NavLink to="/expenses" className="text-sm font-semibold text-violet-700">Record expenses</NavLink>}/><Panel><div className="grid gap-3">{[...state.expenses].sort((a,b)=>b.date.localeCompare(a.date)).map(expense=><LedgerRow key={expense.id} left={expense.name} meta={[expense.payeeName,formatShortDate(expense.date),expense.category,expense.paidBy,expense.paymentMethod].filter(Boolean).join(" | ")} amount={expense.amount} action={<Button variant="ghost" onClick={()=>actions.deleteExpense(expense.id)} title="Delete expense"><Trash2 size={16}/></Button>}/>)}{!state.expenses.length&&<EmptyState title="No expenses yet" description="Record an expense to see it here."/>}</div></Panel></div>;
}

function FormQuestion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 text-sm font-medium text-slate-800 shadow-sm">
      <span>{label}</span>
      {children}
    </label>
  );
}

function BillsPage() {
  const data = useActiveFinance();
  const [editing, setEditing] = useState<Bill | null>(null);
  const groups = upcomingBills(data.state.bills, todayInputValue());
  return (
    <div className="grid gap-6">
      <PageHeader title="Monthly Bills" description="Track upcoming, overdue, and paid household bills. Paid bills can create expenses automatically." />
      <Panel><BillForm key={editing?.id || "new-bill"} initial={editing} onDone={() => setEditing(null)} /></Panel>
      <div className="grid gap-4 xl:grid-cols-4">
        <BillGroup title="Due Today" bills={groups.dueToday} data={data} onEdit={setEditing} />
        <BillGroup title="Due This Week" bills={groups.dueThisWeek} data={data} onEdit={setEditing} />
        <BillGroup title="Overdue" bills={groups.overdue} data={data} onEdit={setEditing} />
        <BillGroup title="Upcoming" bills={groups.upcoming} data={data} onEdit={setEditing} />
        <BillGroup title="Paid" bills={data.state.bills.filter(b => b.status === "Paid")} data={data} onEdit={setEditing} />
      </div>
    </div>
  );
}

function BillGroup({ title, bills, data, onEdit }: { title: string; bills: Bill[]; data: ReturnType<typeof useActiveFinance>; onEdit: (bill: Bill) => void }) {
  return <Panel><h2 className="font-semibold">{title}</h2><div className="mt-3 grid gap-2">{bills.length ? bills.map((bill) => <div key={bill.id} className="rounded-2xl border border-[#ececf1] p-4"><div className="flex items-start justify-between"><div><p className="font-semibold">{bill.name}</p><p className="text-sm text-slate-500">Due {formatShortDate(bill.dueDate)}</p><p className="text-sm text-slate-500">{bill.paidBy && bill.paymentMethod ? bill.paidBy + " · " + bill.paymentMethod : "Choose a payment source before paying"}</p></div><StatusBadge label={billStatus(bill, data.state.profile.demoToday)} tone={billStatus(bill, data.state.profile.demoToday) === "Overdue" ? "danger" : bill.status === "Paid" ? "success" : "warning"} /></div><p className="mt-2 font-semibold"><MoneyDisplay value={bill.amount} /></p><div className="mt-3 flex gap-2"><Button variant="secondary" onClick={() => bill.paymentMethod && bill.paidBy ? data.actions.markBillPaid(bill.id, true) : onEdit(bill)} disabled={bill.status === "Paid"}><CheckCircle size={16} /> Paid</Button><Button variant="ghost" onClick={() => onEdit(bill)} title="Edit bill"><Pencil size={16} /></Button><Button variant="ghost" onClick={() => data.actions.deleteBill(bill.id)} title="Delete bill"><Trash2 size={16} /></Button></div></div>) : <EmptyState title="Nothing here" description="No bills in this section." />}</div></Panel>;
}

function BillForm({ initial, onDone }: { initial?: Bill | null; onDone: () => void }) {
  const data = useActiveFinance();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      paidBy: getString(form, "paidBy") as Expense["paidBy"],
      paymentMethod: getString(form, "paymentMethod") as PaymentMethod,
      name: getString(form, "name"),
      category: getString(form, "category"),
      amount: getNumber(form, "amount"),
      dueDate: getString(form, "dueDate"),
      assignedCutoffId: data.cutoff.id,
      frequency: getString(form, "frequency") as Bill["frequency"],
      status: initial?.status || "Pending" as Bill["status"],
      autoInclude: form.get("autoInclude") === "on",
      notes: getString(form, "notes")
    };
    data.actions.upsertBill(initial ? { ...payload, id: initial.id } : payload);
    event.currentTarget.reset();
    onDone();
  };
  return <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}><Field label="Whose money will pay this bill?"><select className={inputClass} name="paidBy" required defaultValue={initial?.paidBy === "Joselle" ? "Joselle" : "Ruru"}><option>Ruru</option><option>Joselle</option></select></Field><div className="md:col-span-3 grid gap-3 md:grid-cols-2"><MoneyTypeFields initial={initial?.paymentMethod} /></div><Field label="Bill Name"><input className={inputClass} name="name" required defaultValue={initial?.name || ""} /></Field><Field label="Category"><input className={inputClass} name="category" required defaultValue={initial?.category || "Utilities"} /></Field><Field label="Amount"><input className={inputClass} name="amount" required type="number" min="0.01" step="0.01" defaultValue={initial?.amount || ""} /></Field><Field label="Due Date"><input className={inputClass} name="dueDate" required type="date" defaultValue={initial?.dueDate || data.state.profile.demoToday} /></Field><Field label="Frequency"><select className={inputClass} name="frequency" defaultValue={initial?.frequency || "Monthly"}><option>Monthly</option><option>Weekly</option><option>Quarterly</option><option>Yearly</option><option>One-Time</option></select></Field><Field label="Notes"><input className={inputClass} name="notes" defaultValue={initial?.notes || ""} /></Field><label className="flex items-center gap-2 pt-7 text-sm font-semibold"><input name="autoInclude" type="checkbox" defaultChecked={initial?.autoInclude ?? true} /> Auto include in budget</label><div className="md:col-span-4 flex gap-2"><Button type="submit"><CheckCircle size={17} /> {initial ? "Save Bill" : "Add Bill"}</Button>{initial ? <Button variant="secondary" onClick={onDone}>Cancel</Button> : null}</div></form>;
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
  return <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}><Field label="Debt Name"><input className={inputClass} name="name" required defaultValue={initial?.name || ""} /></Field><Field label="Creditor"><input className={inputClass} name="creditor" required defaultValue={initial?.creditor || ""} /></Field><Field label="Debt Type"><select className={inputClass} name="type" defaultValue={initial?.type || "Credit Card"}><option>Credit Card</option><option>Personal Loan</option><option>Car Loan</option><option>Home Loan</option><option>Installment</option><option>Borrowed Money</option><option>Other</option></select></Field><Field label="Original Amount"><input className={inputClass} name="originalAmount" type="number" min="0.01" step="0.01" required defaultValue={initial?.originalAmount || ""} /></Field><Field label="Remaining Balance" hint="Leave blank to start with the original amount."><input className={inputClass} name="remainingBalance" type="number" min="0" step="0.01" defaultValue={initial?.remainingBalance ?? ""} /></Field><Field label="Monthly minimum payment"><input className={inputClass} name="minimumPayment" type="number" min="0" step="0.01" required defaultValue={initial?.minimumPayment || ""} /></Field><Field label="Preferred monthly payment"><input className={inputClass} name="plannedPayment" type="number" min="0" step="0.01" required defaultValue={initial?.plannedPayment || ""} /></Field><Field label="Interest rate (%)"><input className={inputClass} name="interestRate" type="number" min="0" step="0.01" defaultValue={initial?.interestRate || 0} /></Field><Field label="Rate period"><select className={inputClass} name="interestRatePeriod" defaultValue={initial?.interestRatePeriod || "Annual"}><option>Annual</option><option>Monthly</option></select></Field><Field label="First due date" hint="Repeats monthly on this day."><input className={inputClass} name="dueDate" type="date" required defaultValue={initial?.dueDate || todayInputValue()} /></Field><Field label="Notes"><input className={inputClass} name="notes" defaultValue={initial?.notes || ""} /></Field><div className="md:col-span-4 flex gap-2"><Button type="submit"><CheckCircle size={17} /> {initial ? "Save Debt" : "Add Debt"}</Button>{initial ? <Button variant="secondary" onClick={onDone}>Cancel</Button> : null}</div></form>;
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
  return <div className="grid gap-6"><PageHeader title="Transaction History" description="Centralized ledger across income, expenses, bill payments, debt payments, and savings movements." /><Panel><div className="grid gap-3 md:grid-cols-3"><input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ledger" /><select className={inputClass} value={type} onChange={(event) => setType(event.target.value)}><option>All</option><option>Income</option><option>Expense</option><option>Bill Payment</option><option>Debt Payment</option><option>Savings Contribution</option><option>Savings Withdrawal</option></select><select className={inputClass} value={cutoff} onChange={(event) => setCutoff(event.target.value)}><option value="All">All Cutoffs</option>{data.state.cutoffs.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div><div className="mt-4 grid gap-2">{filtered.map((transaction) => <div key={transaction.id} className="grid gap-2 rounded-2xl border border-[#ececf1] p-4 md:grid-cols-[140px_1fr_170px_130px]"><p className="text-sm text-slate-500">{formatShortDate(transaction.date)}</p><div><p className="font-semibold">{transaction.description}</p><p className="text-sm text-slate-500">{transaction.category} | {transaction.person}</p></div><StatusBadge label={transaction.type} tone={transaction.type === "Income" ? "success" : transaction.type.includes("Savings") ? "accent" : transaction.type.includes("Debt") ? "warning" : "neutral"} /><p className="text-right font-semibold"><MoneyDisplay value={transaction.amount} /></p></div>)}</div></Panel></div>;
}

function SettingsPage() {
  const data = useActiveFinance();
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
  return <div className="grid gap-6"><PageHeader title="Settings" description="Manage monthly bill allocations, debts, wishlist goals, and your saved budget data." /><Panel><div className="grid gap-3 sm:grid-cols-3"><HomeActionLink to="/bills" label="Allocation for Monthly bills" icon={CalendarDays} tone="accent"/><HomeActionLink to="/debts" label="List of debts" icon={CreditCard} tone="accent"/><HomeActionLink to="/wishlist" label="List of wishlist" icon={Target} tone="accent"/></div></Panel><Panel><h2 className="text-lg font-semibold">Data Management</h2><p className="mt-1 text-sm text-slate-500">Budget data syncs to Supabase after login and keeps a local cache on this device.</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={exportData}><ArrowDown size={17} /> Export Data</Button><Button variant="secondary" onClick={() => fileInputRef.current?.click()}><ArrowUp size={17} /> Import Data</Button><Button variant="danger" onClick={data.actions.resetDemoData}><Trash2 size={17} /> Reset All Data</Button></div><input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(event) => importData(event.target.files?.[0])} /></Panel></div>;
}
