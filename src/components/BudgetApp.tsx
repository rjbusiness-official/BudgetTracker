"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Calendar,
  CalendarDays,
  Car,
  ChartBar,
  CheckCircle,
  CircleDollarSign,
  Clock,
  CreditCard,
  Fuel,
  Heart,
  Landmark,
  LayoutDashboard,
  List,
  LogOut,
  Pencil,
  PhilippinePeso,
  PiggyBank,
  Plus,
  Receipt,
  ShoppingCart,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Utensils,
  Wallet
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { BudgetProvider, useBudget } from "@/src/context/BudgetContext";
import type {
  Bill,
  BudgetCategory,
  Debt,
  Expense,
  FamilyShare,
  Income,
  PaymentMethod,
  SalaryAllocation,
  WishlistItem
} from "@/src/types/budget";
import {
  actualSpend,
  actualUpToDate,
  billStatus,
  budgetHealth,
  buildTransactions,
  calculateMonthlySummary,
  categoriesForCutoff,
  categoryActual,
  cumulativeDailySeries,
  dailyActual,
  dailyDifference,
  dailyPlanSeries,
  dailyPlansForCutoff,
  dailyStatus,
  daysRemaining,
  debtProgress,
  expensesForCutoff,
  expensesForSalaryPeriod,
  formatCurrency,
  formatLongDate,
  formatShortDate,
  getActiveCutoff,
  incomeByPerson,
  incomePersonForExpense,
  incomesForCutoff,
  plannedByGroup,
  plannedUpToDate,
  protectedSavings,
  recommendedDailyBudget,
  reservedMoney,
  safeToSpend,
  savingsProgress,
  spendableBudget,
  totalAllocation,
  toDate,
  totalIncome,
  totalSavings,
  unallocatedMoney,
  upcomingBills,
  usagePercentage
} from "@/src/utils/finance";
import { Button, EmptyState, Field, Modal, MoneyDisplay, PageHeader, Panel, ProgressBar, StatusBadge, SummaryCard, cn, inputClass } from "@/src/components/ui";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const paymentMethods: PaymentMethod[] = ["Cash", "GCash", "Maya", "Bank Transfer", "Debit Card", "Credit Card", "Other"];
const incomeSourceOptions = ["Salary", "Pag-IBIG Loan", "SSS Loan", "Commission", "Freelance", "Other"];
const expenseFallbackCategories = ["Food", "Gas", "Parking", "Bills", "Monthly Bills", "Debt Payments", "Family Share", "Shopping", "Planned Purchases", "Personal", "Transportation", "Medical", "Entertainment", "Others"];
const chartColors = ["#6c63f6", "#2cc5a7", "#f5bd3d", "#ef5d7a", "#2f3654", "#a8a1ff", "#c7c2ff", "#7b70ff", "#d9d6ff", "#f0b6c7", "#9aa3b2"];

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
  const { state, actions, sync } = useBudget();
  return useMemo(() => {
    const cutoff = getActiveCutoff(state);
    const categories = categoriesForCutoff(state, cutoff.id);
    const incomes = incomesForCutoff(state, cutoff.id);
    const expenses = expensesForCutoff(state, cutoff.id);
    const dailyPlans = dailyPlansForCutoff(state, cutoff.id);
    const bills = state.bills.filter((bill) => bill.assignedCutoffId === cutoff.id);
    const debts = state.debts.filter((debt) => debt.assignedCutoffId === cutoff.id);
    const debtPayments = state.debtPayments.filter((payment) => payment.cutoffId === cutoff.id);
    const savingsTransactions = state.savingsTransactions.filter((transaction) => transaction.cutoffId === cutoff.id);
    const familyShares = state.familyShares.filter((item) => item.cutoffId === cutoff.id);
    const incomeTotal = totalIncome(incomes);
    const allocated = totalAllocation(categories);
    const spending = actualSpend(expenses);
    const debtPaid = sum(debtPayments.map((payment) => payment.amount));
    const savingsMoved = sum(savingsTransactions.filter((transaction) => transaction.type === "Contribution").map((transaction) => transaction.amount));
    const outflows = spending + debtPaid + savingsMoved;
    const spendable = spendableBudget(categories);
    const safe = safeToSpend(spendable, dailyPlans, expenses, state.profile.demoToday);
    const recommended = recommendedDailyBudget(spendable, expenses, cutoff, state.profile.demoToday);
    return {
      state,
      actions,
      sync,
      cutoff,
      categories,
      incomes,
      expenses,
      dailyPlans,
      bills,
      debts,
      debtPayments,
      savingsTransactions,
      familyShares,
      incomeTotal,
      allocated,
      spending,
      debtPaid,
      savingsMoved,
      outflows,
      spendable,
      safe,
      recommended
    };
  }, [state, actions, sync]);
}

function categoryNames(categories: BudgetCategory[]) {
  return Array.from(new Set([...categories.map((category) => category.name), ...expenseFallbackCategories]));
}

function incomeTypeForSource(source: string): Income["type"] {
  if (source === "Pag-IBIG Loan" || source === "SSS Loan") return "Government Loan";
  if (source === "Commission") return "Commission";
  if (source === "Freelance") return "Freelance";
  if (source === "Salary") return "Salary";
  return "Other";
}

function isSalaryIncomeRecord(income: Income) {
  return income.type === "Salary" || income.source === "Salary";
}

function dayCountBetween(startDate: string, endDate: string) {
  const start = toDate(startDate).getTime();
  const end = toDate(endDate).getTime();
  return Math.max(1, Math.ceil((end - start) / 86400000));
}

function currentSalaryCycle(state: ReturnType<typeof useBudget>["state"], paidBy: Expense["paidBy"]) {
  const salaryRecords = state.incomes.filter((income) => isSalaryIncomeRecord(income) && income.person === incomePersonForExpense(paidBy)).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const salary = salaryRecords[0];
  if (!salary) return null;
  const ascending = [...salaryRecords].reverse();
  const salaryIndex = ascending.findIndex((income) => income.id === salary.id);
  const nextSalary = salaryIndex >= 0 ? ascending[salaryIndex + 1] : undefined;
  const allocations = state.salaryAllocations.filter((allocation) => allocation.incomeId === salary.id);
  const allocated = allocations.reduce((total, allocation) => total + allocation.amount, 0);
  const expenses = expensesForSalaryPeriod(state, salary, nextSalary);
  const spent = actualSpend(expenses);
  const remaining = salary.amount - allocated - spent;
  return { salary, nextSalary, allocations, allocated, spent, remaining };
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
    <div className="min-h-screen bg-[#f1f3f4] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 md:px-6 md:py-6">
        <header className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <NavLink to="/" className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#673ab7] text-white shadow-sm">
              <Heart size={22} fill="currentColor" strokeWidth={1.5} />
              <PhilippinePeso className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 text-[#673ab7] shadow-sm" size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#673ab7]">Budget Tracker</p>
              <p className="truncate text-sm font-medium text-slate-700">{data.state.profile.husbandName} and {data.state.profile.wifeName}</p>
            </div>
          </NavLink>
          <div className="flex items-center gap-2">
            {showBack ? <BackToChoices /> : null}
            <Button variant="secondary" onClick={() => void signOut()}><LogOut size={17} /> Sign out</Button>
          </div>
        </header>
        <main className="flex-1 py-6 md:py-10">
          <Routes>
            <Route path="/" element={<ActionHomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/budget" element={<CutoffBudgetPage />} />
            <Route path="/daily" element={<DailyBudgetPage />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/debts" element={<DebtsPage />} />
            <Route path="/savings" element={<SavingsPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/family" element={<FamilySharePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/transactions" element={<TransactionHistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function ActionHomePage() {
  const data = useActiveFinance();
  return (
    <div className="mx-auto w-full max-w-xl">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-[#673ab7]" />
        <div className="border-b border-slate-200 px-6 py-5">
          <h1 className="text-2xl font-normal text-slate-950">Money Tracker</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{data.state.profile.husbandName} and {data.state.profile.wifeName}</p>
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2">
          <HomeActionLink to="/expenses" label="Record Expense" icon={Receipt} tone="danger" />
          <HomeActionLink to="/income" label="Record Income" icon={PhilippinePeso} tone="success" />
          <HomeActionLink to="/savings" label="Record Savings" icon={PiggyBank} tone="success" className="sm:col-span-2" />
          <HomeActionLink to="/dashboard" label="Dashboard" icon={LayoutDashboard} tone="accent" className="sm:col-span-2" />
        </div>
      </section>
    </div>
  );
}

function HomeActionLink({ to, label, icon: Icon, tone, className }: { to: string; label: string; icon: LucideIcon; tone: "success" | "danger" | "accent"; className?: string }) {
  const toneClass = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    danger: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    accent: "border-[#d8d3ff] bg-[#f5f3ff] text-[#5b52e6] hover:bg-[#ece9ff]"
  }[tone];
  return (
    <NavLink to={to} className={cn("flex min-h-14 items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#673ab7]/30", toneClass, className)}>
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

function BackToChoices() {
  return (
    <NavLink to="/" className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#673ab7]/30">
      <ArrowLeft size={17} />
      <span>Back</span>
    </NavLink>
  );
}

function DashboardPage() {
  const data = useActiveFinance();
  const salaryRecords = useMemo(() => data.state.incomes.filter(isSalaryIncomeRecord).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)), [data.state.incomes]);
  const [selectedSalaryId, setSelectedSalaryId] = useState("");

  useEffect(() => {
    if (!salaryRecords.length) {
      if (selectedSalaryId) setSelectedSalaryId("");
      return;
    }
    if (!salaryRecords.some((income) => income.id === selectedSalaryId)) setSelectedSalaryId(salaryRecords[0].id);
  }, [salaryRecords, selectedSalaryId]);

  const salaryAscending = [...salaryRecords].reverse();
  const selectedSalary = salaryRecords.find((income) => income.id === selectedSalaryId) || salaryRecords[0];
  const selectedSalaryIndex = selectedSalary ? salaryAscending.findIndex((income) => income.id === selectedSalary.id) : -1;
  const nextSalary = selectedSalaryIndex >= 0 ? salaryAscending.slice(selectedSalaryIndex + 1).find((income) => income.person === selectedSalary?.person) : undefined;
  const allocations = selectedSalary ? data.state.salaryAllocations.filter((allocation) => allocation.incomeId === selectedSalary.id) : [];
  const allocated = sum(allocations.map((allocation) => allocation.amount));
  const salaryExpenses = selectedSalary ? expensesForSalaryPeriod(data.state, selectedSalary, nextSalary) : [];
  const spentFromSalary = actualSpend(salaryExpenses);
  const remainingFromSalary = selectedSalary ? selectedSalary.amount - allocated - spentFromSalary : 0;
  const salaryDays = selectedSalary && nextSalary ? dayCountBetween(selectedSalary.date, nextSalary.date) : 0;
  const availableDaily = salaryDays ? Math.max(0, remainingFromSalary) / salaryDays : Math.max(0, remainingFromSalary);
  const moneyIn = totalIncome(data.state.incomes);
  const moneyOut = actualSpend(data.state.expenses);
  const balance = moneyIn - moneyOut;
  const salarySavings = data.state.salarySavingsRecords;
  const savings = totalSavings(data.state);
  const recentTransactions = buildTransactions(data.state)
    .filter((transaction) => transaction.type === "Income" || transaction.type === "Expense" || transaction.type === "Savings Contribution")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-[#673ab7]" />
        <div className="px-6 py-5">
          <h1 className="text-2xl font-normal text-slate-950">Dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Allocate each salary, then spend from what remains until the next salary is recorded.</p>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Money In" value={formatCurrency(moneyIn)} icon={TrendingUp} tone="success" />
        <SummaryCard label="Money Out" value={formatCurrency(moneyOut)} icon={TrendingDown} tone="danger" />
        <SummaryCard label="Balance" value={formatCurrency(balance)} icon={Wallet} tone={balance >= 0 ? "success" : "danger"} />
        <SummaryCard label="Savings" value={formatCurrency(savings)} icon={PiggyBank} tone="accent" />
      </div>
      {selectedSalary ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_260px] md:items-end">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Salary Allocation</h2>
              <p className="mt-1 text-sm text-slate-500">Salary recorded on {formatLongDate(selectedSalary.date)} for {formatCurrency(selectedSalary.amount)}.</p>
            </div>
            <Field label="Choose salary">
              <select className={inputClass} value={selectedSalary.id} onChange={(event) => setSelectedSalaryId(event.target.value)}>
                {salaryRecords.map((income) => <option key={income.id} value={income.id}>{formatShortDate(income.date)} - {income.person} - {formatCurrency(income.amount)}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <SummaryCard label="Salary Amount" value={formatCurrency(selectedSalary.amount)} icon={PhilippinePeso} tone="success" />
            <SummaryCard label="Allocated" value={formatCurrency(allocated)} icon={Target} tone="accent" />
            <SummaryCard label="Spent From Salary" value={formatCurrency(spentFromSalary)} icon={Receipt} tone="danger" />
            <SummaryCard label={salaryDays ? "Available Daily" : "Available Until Next Salary"} value={formatCurrency(availableDaily)} helper={salaryDays ? String(salaryDays) + " days until next recorded salary" : "Next salary not recorded yet"} icon={Wallet} tone={remainingFromSalary >= 0 ? "success" : "danger"} />
          </div>
          <SalaryAllocationForm salary={selectedSalary} />
          <div className="mt-4 grid gap-2">
            {allocations.length ? allocations.map((allocation) => <SalaryAllocationRow key={allocation.id} salary={selectedSalary} allocation={allocation} />) : <EmptyState title="No allocations yet" description="Add allocations like Gas, Parking, Bills, and the rest stays available to spend." />}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <EmptyState title="Record salary income first" description="Use Record Income and choose Salary as the source to start salary allocation." />
        </section>
      )}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Savings From Excess Money</h2>
        <div className="mt-4 grid gap-2">
          {salarySavings.length ? salarySavings.map((record) => {
            const income = data.state.incomes.find((item) => item.id === record.incomeId);
            return <LedgerRow key={record.id} left="Excess money" meta={(income ? formatShortDate(income.date) + " salary" : "Previous salary") + " | " + record.note} amount={record.amount} />;
          }) : <EmptyState title="No excess savings yet" description="When a new salary is recorded, leftover money from the previous salary is saved here automatically." />}
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Recent In and Out</h2>
        <div className="mt-4 grid gap-2">
          {recentTransactions.length ? recentTransactions.map((transaction) => (
            <div key={transaction.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[120px_1fr_120px] md:items-center">
              <p className="text-sm text-slate-500">{formatShortDate(transaction.date)}</p>
              <div>
                <p className="font-semibold text-slate-900">{transaction.description}</p>
                <p className="text-sm text-slate-500">{transaction.type} | {transaction.category}</p>
              </div>
              <p className={cn("font-semibold md:text-right", transaction.type === "Income" || transaction.type === "Savings Contribution" ? "text-emerald-700" : "text-rose-700")}><MoneyDisplay value={transaction.amount} /></p>
            </div>
          )) : <EmptyState title="No records yet" description="Record income or expenses to see them here." />}
        </div>
      </section>
    </div>
  );
}

function SalaryAllocationForm({ salary }: { salary: Income }) {
  const data = useActiveFinance();
  const categories = categoryNames(data.state.budgetCategories);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    data.actions.setSalaryAllocation(salary.id, getString(form, "category"), getNumber(form, "amount"));
    event.currentTarget.reset();
  };
  return (
    <form className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_180px_auto] md:items-end" onSubmit={submit}>
      <Field label="Allocation category">
        <select className={inputClass} name="category" defaultValue="Gas">{categories.map((category) => <option key={category}>{category}</option>)}</select>
      </Field>
      <Field label="Amount">
        <input className={inputClass} name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" />
      </Field>
      <Button type="submit"><Plus size={17} /> Allocate</Button>
    </form>
  );
}

function SalaryAllocationRow({ salary, allocation }: { salary: Income; allocation: SalaryAllocation }) {
  const data = useActiveFinance();
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_180px_auto] md:items-center">
      <p className="font-semibold text-slate-900">{allocation.category}</p>
      <input className={inputClass} type="number" min="0" step="0.01" value={allocation.amount} onChange={(event) => data.actions.setSalaryAllocation(salary.id, allocation.category, Number(event.target.value))} aria-label={allocation.category + " allocation amount"} />
      <Button variant="ghost" onClick={() => data.actions.setSalaryAllocation(salary.id, allocation.category, 0)} title="Remove allocation"><Trash2 size={16} /></Button>
    </div>
  );
}

function TodayMetric({ label, value, helper }: { label: string; value: number; helper?: string }) {
  return (
    <div className="rounded-lg border border-[#d8d3ff] bg-[#f8f7ff] p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold"><MoneyDisplay value={value} /></p>
      {helper ? <p className="text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

function MoneyRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <div className={cn("flex items-center justify-between gap-4", strong && "border-t border-slate-200 pt-3 font-semibold")}><span>{label}</span><MoneyDisplay value={value} /></div>;
}

function BudgetCategoryRow({ category, actual, health }: { category: BudgetCategory; actual: number; health: { label: string; tone: Tone } }) {
  const remaining = category.planned - actual;
  const used = usagePercentage(actual, category.planned);
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">{category.name}</p>
          <p className="text-sm text-slate-500">Budget <MoneyDisplay value={category.planned} /> | Spent <MoneyDisplay value={actual} /> | Remaining <MoneyDisplay value={remaining} /></p>
        </div>
        <StatusBadge label={actual > category.planned ? "Over by " + formatCurrency(Math.abs(remaining)) : health.label} tone={health.tone} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={used} tone={health.tone === "danger" ? "danger" : health.tone === "warning" ? "warning" : "success"} />
        <span className="w-16 text-right text-sm font-semibold text-slate-600">{used.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function CutoffBudgetPage() {
  const data = useActiveFinance();
  const [categoryName, setCategoryName] = useState("");
  const [categoryAmount, setCategoryAmount] = useState(0);
  const unallocated = unallocatedMoney(data.incomeTotal, data.categories);
  const addCustomCategory = () => {
    if (!categoryName.trim() || categoryAmount <= 0) return;
    data.actions.addCategory({ name: categoryName.trim(), planned: categoryAmount, group: "custom", cutoffId: data.cutoff.id });
    setCategoryName("");
    setCategoryAmount(0);
  };
  return (
    <div className="grid gap-6">
      <PageHeader title="Cutoff Budget" description="Record your actual take-home income for this cutoff first, then allocate it. This supports taxes, deductions, bonuses, and changing pay." actions={<Button variant="secondary" onClick={data.actions.copyPreviousBudget}><Clock size={17} /> Copy Previous Cutoff Budget</Button>} />
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Ruru Income" value={formatCurrency(incomeByPerson(data.state.incomes, "Husband"))} helper="Recorded this cutoff" icon={PhilippinePeso} />
        <SummaryCard label="Joselle Income" value={formatCurrency(incomeByPerson(data.state.incomes, "Wife"))} helper="Recorded this cutoff" icon={PhilippinePeso} />
        <SummaryCard label="Additional Income" value={formatCurrency(incomeByPerson(data.state.incomes, "Shared"))} helper="Shared or other income" icon={Plus} />
        <SummaryCard label="Combined Income" value={formatCurrency(totalIncome(data.state.incomes))} helper="Total money received" icon={Wallet} tone="accent" />
      </div>
      <Panel>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Allocation Formula</h2>
            <p className="text-sm text-slate-500">Combined income minus all allocations equals unallocated money.</p>
          </div>
          <StatusBadge label={unallocated >= 0 ? formatCurrency(unallocated) + " available to allocate" : "Budget exceeded by " + formatCurrency(Math.abs(unallocated))} tone={unallocated >= 0 ? "success" : "danger"} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.categories.map((category) => (
            <div key={category.id} className="rounded-lg border border-slate-200 p-3">
              <Field label={category.name} hint={category.group === "reserved" ? "Reserved money" : category.group === "savings" ? "Protected savings" : "Spendable allocation"}>
                <input className={inputClass} type="number" min="0" step="0.01" value={category.planned} onChange={(event) => data.actions.updateCategory({ ...category, planned: Number(event.target.value) })} />
              </Field>
              <div className="mt-3 flex items-center justify-between gap-2">
                <select className={cn(inputClass, "min-h-9 py-1 text-xs")} value={category.group} onChange={(event) => data.actions.updateCategory({ ...category, group: event.target.value as BudgetCategory["group"] })}>
                  <option value="reserved">Reserved</option>
                  <option value="spendable">Spendable</option>
                  <option value="savings">Savings</option>
                  <option value="personal">Personal</option>
                  <option value="custom">Custom</option>
                </select>
                {!category.locked ? <Button variant="ghost" onClick={() => data.actions.deleteCategory(category.id)} title="Delete category"><Trash2 size={16} /></Button> : null}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2 className="text-lg font-semibold">Custom Budget Category</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input className={inputClass} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Category name" />
          <input className={inputClass} type="number" min="0.01" step="0.01" value={categoryAmount || ""} onChange={(event) => setCategoryAmount(Number(event.target.value))} placeholder="Amount" />
          <Button onClick={addCustomCategory}><Plus size={17} /> Add Category</Button>
        </div>
      </Panel>
    </div>
  );
}

function DailyBudgetPage() {
  const data = useActiveFinance();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const totalDailyPlan = sum(data.dailyPlans.map((day) => day.planned));
  const selectedPlan = data.dailyPlans.find((day) => day.date === selectedDay);
  const selectedExpenses = data.expenses.filter((expense) => expense.date === selectedDay);
  return (
    <div className="grid gap-6">
      <PageHeader title="Daily Budget Plan" description="Plan each day in the cutoff, compare actual spending, and recover from overages before payday." actions={<><Button variant="secondary" onClick={data.actions.generateEqualDailyPlan}><Target size={17} /> Equal Daily Budget</Button><Button variant={view === "list" ? "primary" : "secondary"} onClick={() => setView("list")}><List size={17} /> List</Button><Button variant={view === "calendar" ? "primary" : "secondary"} onClick={() => setView("calendar")}><CalendarDays size={17} /> Calendar</Button></>} />
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Spendable Budget" value={formatCurrency(data.spendable)} helper="Available for daily spending" icon={Wallet} />
        <SummaryCard label="Daily Plan Total" value={formatCurrency(totalDailyPlan)} helper={totalDailyPlan > data.spendable ? "Plan exceeds spendable budget" : "Within spendable budget"} icon={CalendarDays} tone={totalDailyPlan > data.spendable ? "danger" : "success"} />
        <SummaryCard label="Actual So Far" value={formatCurrency(data.spending)} helper="Recorded expenses" icon={Receipt} />
        <SummaryCard label="Smart Daily Budget" value={formatCurrency(data.recommended)} helper="Based on remaining spendable money" icon={TrendingDown} tone="accent" />
      </div>
      {totalDailyPlan > data.spendable ? <Panel className="border-amber-300 bg-amber-50"><p className="text-sm font-semibold text-amber-800">Warning: daily planned spending exceeds available spendable budget by {formatCurrency(totalDailyPlan - data.spendable)}.</p></Panel> : null}
      <Panel>
        <div className={view === "calendar" ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-5" : "grid gap-3"}>
          {data.dailyPlans.map((daily) => {
            const actual = dailyActual(data.expenses, daily.date);
            const diff = daily.planned - actual;
            const status = dailyStatus(daily.planned, actual);
            return (
              <div key={daily.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <button className="text-left" onClick={() => setSelectedDay(daily.date)} type="button">
                    <p className="font-semibold">{formatLongDate(daily.date)}</p>
                    <p className="text-sm text-slate-500">{diff >= 0 ? formatCurrency(diff) + " under budget" : formatCurrency(Math.abs(diff)) + " over budget"}</p>
                  </button>
                  <StatusBadge label={status.label.replace("Comfortably ", "")} tone={status.tone} />
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <Field label="Planned"><input className={inputClass} type="number" min="0" step="0.01" value={daily.planned} onChange={(event) => data.actions.setDailyPlan(daily.date, Number(event.target.value))} /></Field>
                  <div><p className="text-sm font-medium text-slate-700">Actual</p><p className="mt-2 font-semibold"><MoneyDisplay value={actual} /></p></div>
                  <div><p className="text-sm font-medium text-slate-700">Difference</p><p className={cn("mt-2 font-semibold", diff >= 0 ? "text-emerald-600" : "text-rose-600")}><MoneyDisplay value={Math.abs(diff)} /></p></div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <ProgressBar value={usagePercentage(actual, daily.planned)} tone={status.tone === "danger" ? "danger" : status.tone === "warning" ? "warning" : "success"} />
                  {diff > 0 ? <Button variant="ghost" onClick={() => data.actions.carryForwardUnused(daily.date)}>Carry {formatCurrency(diff)} Forward</Button> : null}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
      {selectedPlan ? <Modal title={formatLongDate(selectedPlan.date)} onClose={() => setSelectedDay(null)}>
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryCard label="Planned" value={formatCurrency(selectedPlan.planned)} icon={Calendar} />
            <SummaryCard label="Actual" value={formatCurrency(dailyActual(data.expenses, selectedPlan.date))} icon={Receipt} />
            <SummaryCard label="Difference" value={formatCurrency(Math.abs(selectedPlan.planned - dailyActual(data.expenses, selectedPlan.date)))} helper={selectedPlan.planned >= dailyActual(data.expenses, selectedPlan.date) ? "under budget" : "over budget"} icon={TrendingUp} tone={selectedPlan.planned >= dailyActual(data.expenses, selectedPlan.date) ? "success" : "danger"} />
          </div>
          <div className="grid gap-2">
            {selectedPlan.categoryPlans.length ? selectedPlan.categoryPlans.map((plan) => {
              const category = data.categories.find((item) => item.id === plan.categoryId);
              const actual = category ? sum(selectedExpenses.filter((expense) => expense.category === category.name).map((expense) => expense.amount)) : 0;
              return <MoneyRow key={plan.categoryId} label={(category?.name || "Category") + " planned vs actual"} value={plan.planned - actual} />;
            }) : <p className="text-sm text-slate-500">No category-level plans set for this day.</p>}
          </div>
          <div>
            <h3 className="font-semibold">Transactions</h3>
            <div className="mt-3 grid gap-2">
              {selectedExpenses.length ? selectedExpenses.map((expense) => <LedgerRow key={expense.id} left={expense.name} meta={expense.category + " | " + expense.paymentMethod} amount={expense.amount} />) : <EmptyState title="No spending recorded" description="Add an expense to update this day automatically." />}
            </div>
          </div>
          {selectedPlan.planned < dailyActual(data.expenses, selectedPlan.date) ? <Panel className="bg-rose-50"><p className="text-sm text-rose-800">You overspent by {formatCurrency(dailyActual(data.expenses, selectedPlan.date) - selectedPlan.planned)}. Reduce average spending by around {formatCurrency((dailyActual(data.expenses, selectedPlan.date) - selectedPlan.planned) / Math.max(1, data.dailyPlans.filter((day) => day.date > selectedPlan.date).length))} for the remaining days to stay within your cutoff budget.</p></Panel> : null}
        </div>
      </Modal> : null}
    </div>
  );
}

function LedgerRow({ left, meta, amount, action }: { left: string; meta: string; amount: number; action?: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"><div><p className="font-semibold">{left}</p><p className="text-sm text-slate-500">{meta}</p></div><div className="flex items-center gap-2"><p className="font-semibold"><MoneyDisplay value={amount} /></p>{action}</div></div>;
}

function IncomePage() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-[#673ab7]" />
        <div className="px-6 py-5">
          <h1 className="text-2xl font-normal text-slate-950">Record Income</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Record money coming in.</p>
        </div>
      </section>
      <IncomeForm onDone={() => undefined} />
    </div>
  );
}

function IncomeForm({ initial, onDone }: { initial?: Income | null; onDone: () => void }) {
  const data = useActiveFinance();
  const sources = initial?.source && !incomeSourceOptions.includes(initial.source) ? [initial.source, ...incomeSourceOptions] : incomeSourceOptions;
  const [saveNotice, setSaveNotice] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const source = getString(form, "source");
    const payload: Omit<Income, "id"> = {
      source,
      person: getString(form, "person") as Income["person"],
      amount: getNumber(form, "amount"),
      date: getString(form, "date"),
      cutoffId: data.cutoff.id,
      type: incomeTypeForSource(source),
      notes: getString(form, "notes")
    };
    if (initial) data.actions.updateIncome({ ...payload, id: initial.id }); else data.actions.addIncome(payload);
    event.currentTarget.reset();
    setSaveNotice(initial ? "Income changes have been saved." : "Income has been recorded.");
    onDone();
  };
  return (
    <>
      <form className="grid gap-4" onSubmit={submit}>
        <FormQuestion label="Income For">
          <select className={cn(inputClass, "w-full")} name="person" defaultValue={initial?.person || "Husband"} required><option value="Husband">Ruru</option><option value="Wife">Joselle</option><option value="Shared">Shared fund</option></select>
        </FormQuestion>
        <FormQuestion label="Income Source">
          <select className={cn(inputClass, "w-full")} name="source" defaultValue={initial?.source || "Salary"} required>{sources.map((source) => <option key={source}>{source}</option>)}</select>
        </FormQuestion>
        <FormQuestion label="Amount">
          <input className={cn(inputClass, "w-full")} name="amount" required type="number" min="0.01" step="0.01" defaultValue={initial?.amount || ""} placeholder="0.00" />
        </FormQuestion>
        <FormQuestion label="Date">
          <input className={cn(inputClass, "w-full")} name="date" required type="date" defaultValue={initial?.date || todayInputValue()} />
        </FormQuestion>
        <FormQuestion label="Description">
          <input className={cn(inputClass, "w-full")} name="notes" defaultValue={initial?.notes || ""} placeholder="Optional" />
        </FormQuestion>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <Button type="submit"><CheckCircle size={17} /> {initial ? "Save Income" : "Record Income"}</Button>
          {initial ? <Button variant="secondary" onClick={onDone}>Cancel</Button> : null}
        </div>
      </form>
      {saveNotice ? <SaveSuccessPopup message={saveNotice} onClose={() => setSaveNotice("")} /> : null}
    </>
  );
}

function ExpensesPage() {
  const data = useActiveFinance();
  const [paidBy, setPaidBy] = useState<Expense["paidBy"]>("Ruru");
  const salaryCycle = currentSalaryCycle(data.state, paidBy);
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-[#673ab7]" />
        <div className="px-6 py-5">
          <h1 className="text-2xl font-normal text-slate-950">Record Expense</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Record money going out.</p>
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Available to Spend - {paidBy === "Shared Money" ? "Shared fund" : paidBy}</p>
        <p className={cn("mt-2 text-3xl font-semibold tabular-nums", salaryCycle && salaryCycle.remaining < 0 ? "text-rose-700" : "text-emerald-700")}>
          {formatCurrency(salaryCycle ? salaryCycle.remaining : 0)}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {salaryCycle ? "From " + formatShortDate(salaryCycle.salary.date) + " salary after allocations and recorded expenses." : "Record salary income first to calculate the available balance."}
        </p>
      </section>
      <ExpenseForm paidBy={paidBy} onPaidByChange={setPaidBy} onDone={() => undefined} />
    </div>
  );
}

function ExpenseForm({ initial, onDone, paidBy, onPaidByChange }: { initial?: Expense | null; onDone: () => void; paidBy?: Expense["paidBy"]; onPaidByChange?: (person: Expense["paidBy"]) => void }) {
  const data = useActiveFinance();
  const names = categoryNames(data.categories);
  const [saveNotice, setSaveNotice] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const category = getString(form, "category");
    const payload: Omit<Expense, "id"> = {
      name: getString(form, "name"),
      amount: getNumber(form, "amount"),
      category,
      paidBy: getString(form, "paidBy") as Expense["paidBy"],
      date: getString(form, "date"),
      paymentMethod: "Cash",
      cutoffId: data.cutoff.id,
      notes: ""
    };
    if (initial) data.actions.updateExpense({ ...payload, id: initial.id, billId: initial.billId, wishlistItemId: initial.wishlistItemId }); else data.actions.addExpense(payload);
    event.currentTarget.reset();
    setSaveNotice(initial ? "Expense changes have been saved." : "Expense has been recorded.");
    onDone();
  };
  return (
    <>
      <form className="grid gap-4" onSubmit={submit}>
        <FormQuestion label="Whose Expense">
          <select className={cn(inputClass, "w-full")} name="paidBy" value={paidBy} defaultValue={paidBy === undefined ? initial?.paidBy || "Ruru" : undefined} onChange={(event) => onPaidByChange?.(event.target.value as Expense["paidBy"])} required><option value="Ruru">Ruru</option><option value="Joselle">Joselle</option><option value="Shared Money">Shared fund</option></select>
        </FormQuestion>
        <FormQuestion label="Amount">
          <input className={cn(inputClass, "w-full")} name="amount" required type="number" min="0.01" step="0.01" defaultValue={initial?.amount || ""} placeholder="0.00" />
        </FormQuestion>
        <FormQuestion label="Type of Expense">
          <select className={cn(inputClass, "w-full")} name="category" defaultValue={initial?.category || "Parking"} required>{names.map((name) => <option key={name}>{name}</option>)}</select>
        </FormQuestion>
        <FormQuestion label="Date">
          <input className={cn(inputClass, "w-full")} name="date" required type="date" defaultValue={initial?.date || todayInputValue()} />
        </FormQuestion>
        <FormQuestion label="Description">
          <input className={cn(inputClass, "w-full")} name="name" required defaultValue={initial?.name || ""} placeholder="Parking, bills, groceries" />
        </FormQuestion>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <Button type="submit"><CheckCircle size={17} /> {initial ? "Save Expense" : "Record Expense"}</Button>
          {initial ? <Button variant="secondary" onClick={onDone}>Cancel</Button> : null}
        </div>
      </form>
      {saveNotice ? <SaveSuccessPopup message={saveNotice} onClose={() => setSaveNotice("")} /> : null}
    </>
  );
}

function SaveSuccessPopup({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="save-success-title" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg border border-emerald-200 bg-white p-6 text-center shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle size={28} />
        </div>
        <h2 id="save-success-title" className="mt-4 text-xl font-semibold text-slate-950">Successfully saved</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <button type="button" className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-[#673ab7] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5b32a3] focus:outline-none focus:ring-2 focus:ring-[#673ab7]/30" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
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
  const groups = upcomingBills(data.bills, data.state.profile.demoToday);
  return (
    <div className="grid gap-6">
      <PageHeader title="Bills" description="Track upcoming, overdue, and paid household bills. Paid bills can create expenses automatically." />
      <Panel><BillForm key={editing?.id || "new-bill"} initial={editing} onDone={() => setEditing(null)} /></Panel>
      <div className="grid gap-4 xl:grid-cols-4">
        <BillGroup title="Due Today" bills={groups.dueToday} data={data} onEdit={setEditing} />
        <BillGroup title="Due This Week" bills={groups.dueThisWeek} data={data} onEdit={setEditing} />
        <BillGroup title="Overdue" bills={groups.overdue} data={data} onEdit={setEditing} />
        <BillGroup title="Upcoming" bills={groups.upcoming} data={data} onEdit={setEditing} />
      </div>
    </div>
  );
}

function BillGroup({ title, bills, data, onEdit }: { title: string; bills: Bill[]; data: ReturnType<typeof useActiveFinance>; onEdit: (bill: Bill) => void }) {
  return <Panel><h2 className="font-semibold">{title}</h2><div className="mt-3 grid gap-2">{bills.length ? bills.map((bill) => <div key={bill.id} className="rounded-lg border border-slate-200 p-3"><div className="flex items-start justify-between"><div><p className="font-semibold">{bill.name}</p><p className="text-sm text-slate-500">Due {formatShortDate(bill.dueDate)}</p></div><StatusBadge label={billStatus(bill, data.state.profile.demoToday)} tone={billStatus(bill, data.state.profile.demoToday) === "Overdue" ? "danger" : bill.status === "Paid" ? "success" : "warning"} /></div><p className="mt-2 font-semibold"><MoneyDisplay value={bill.amount} /></p><div className="mt-3 flex gap-2"><Button variant="secondary" onClick={() => data.actions.markBillPaid(bill.id, true)} disabled={bill.status === "Paid"}><CheckCircle size={16} /> Paid</Button><Button variant="ghost" onClick={() => onEdit(bill)} title="Edit bill"><Pencil size={16} /></Button><Button variant="ghost" onClick={() => data.actions.deleteBill(bill.id)} title="Delete bill"><Trash2 size={16} /></Button></div></div>) : <EmptyState title="Nothing here" description="No bills in this section." />}</div></Panel>;
}

function BillForm({ initial, onDone }: { initial?: Bill | null; onDone: () => void }) {
  const data = useActiveFinance();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: getString(form, "name"),
      category: getString(form, "category"),
      amount: getNumber(form, "amount"),
      dueDate: getString(form, "dueDate"),
      assignedCutoffId: data.cutoff.id,
      frequency: getString(form, "frequency") as Bill["frequency"],
      status: getString(form, "status") as Bill["status"],
      autoInclude: form.get("autoInclude") === "on",
      notes: getString(form, "notes")
    };
    data.actions.upsertBill(initial ? { ...payload, id: initial.id } : payload);
    event.currentTarget.reset();
    onDone();
  };
  return <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}><Field label="Bill Name"><input className={inputClass} name="name" required defaultValue={initial?.name || ""} /></Field><Field label="Category"><input className={inputClass} name="category" required defaultValue={initial?.category || "Utilities"} /></Field><Field label="Amount"><input className={inputClass} name="amount" required type="number" min="0.01" step="0.01" defaultValue={initial?.amount || ""} /></Field><Field label="Due Date"><input className={inputClass} name="dueDate" required type="date" defaultValue={initial?.dueDate || data.state.profile.demoToday} /></Field><Field label="Frequency"><select className={inputClass} name="frequency" defaultValue={initial?.frequency || "Monthly"}><option>Monthly</option><option>Weekly</option><option>Quarterly</option><option>Yearly</option><option>One-Time</option></select></Field><Field label="Status"><select className={inputClass} name="status" defaultValue={initial?.status || "Pending"}><option>Pending</option><option>Paid</option><option>Overdue</option></select></Field><Field label="Notes"><input className={inputClass} name="notes" defaultValue={initial?.notes || ""} /></Field><label className="flex items-center gap-2 pt-7 text-sm font-semibold"><input name="autoInclude" type="checkbox" defaultChecked={initial?.autoInclude ?? true} /> Auto include in budget</label><div className="md:col-span-4 flex gap-2"><Button type="submit"><CheckCircle size={17} /> {initial ? "Save Bill" : "Add Bill"}</Button>{initial ? <Button variant="secondary" onClick={onDone}>Cancel</Button> : null}</div></form>;
}

function DebtsPage() {
  const data = useActiveFinance();
  const [editing, setEditing] = useState<Debt | null>(null);
  const totalOriginal = sum(data.debts.map((debt) => debt.originalAmount));
  const totalRemaining = sum(data.debts.map((debt) => debt.remainingBalance));
  return <div className="grid gap-6"><PageHeader title="Debts" description="Plan debt payments, track remaining balances, and record actual payments." /><div className="grid gap-4 md:grid-cols-4"><SummaryCard label="Original Debt" value={formatCurrency(totalOriginal)} icon={CreditCard} /><SummaryCard label="Remaining Debt" value={formatCurrency(totalRemaining)} icon={Landmark} tone="warning" /><SummaryCard label="Total Paid" value={formatCurrency(totalOriginal - totalRemaining)} icon={TrendingDown} tone="success" /><SummaryCard label="Payments This Cutoff" value={formatCurrency(data.debtPaid)} icon={CheckCircle} /></div><Panel><DebtForm key={editing?.id || "new-debt"} initial={editing} onDone={() => setEditing(null)} /></Panel><Panel><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.debts.map((debt) => <div key={debt.id} className="rounded-lg border border-slate-200 p-4"><div className="flex items-start justify-between"><div><p className="font-semibold">{debt.name}</p><p className="text-sm text-slate-500">{debt.creditor} | Due {formatShortDate(debt.dueDate)}</p></div><StatusBadge label={debt.type} tone="accent" /></div><div className="mt-4 grid gap-2 text-sm"><MoneyRow label="Original" value={debt.originalAmount} /><MoneyRow label="Remaining" value={debt.remainingBalance} /><MoneyRow label="Planned Payment" value={debt.plannedPayment} /></div><div className="mt-3"><ProgressBar value={debtProgress(debt)} tone="success" /></div><p className="mt-2 text-sm text-slate-500">{debtProgress(debt).toFixed(0)}% paid</p><DebtPaymentForm debt={debt} /><div className="mt-3 flex gap-2"><Button variant="ghost" onClick={() => setEditing(debt)} title="Edit debt"><Pencil size={16} /></Button><Button variant="ghost" onClick={() => data.actions.deleteDebt(debt.id)} title="Delete debt"><Trash2 size={16} /></Button></div></div>)}</div></Panel></div>;
}

function DebtForm({ initial, onDone }: { initial?: Debt | null; onDone: () => void }) {
  const data = useActiveFinance();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { name: getString(form, "name"), creditor: getString(form, "creditor"), type: getString(form, "type") as Debt["type"], originalAmount: getNumber(form, "originalAmount"), remainingBalance: getNumber(form, "remainingBalance"), minimumPayment: getNumber(form, "minimumPayment"), plannedPayment: getNumber(form, "plannedPayment"), interestRate: getNumber(form, "interestRate"), dueDate: getString(form, "dueDate"), assignedCutoffId: data.cutoff.id, notes: getString(form, "notes") };
    data.actions.upsertDebt(initial ? { ...payload, id: initial.id } : payload);
    event.currentTarget.reset();
    onDone();
  };
  return <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}><Field label="Debt Name"><input className={inputClass} name="name" required defaultValue={initial?.name || ""} /></Field><Field label="Creditor"><input className={inputClass} name="creditor" required defaultValue={initial?.creditor || ""} /></Field><Field label="Debt Type"><select className={inputClass} name="type" defaultValue={initial?.type || "Credit Card"}><option>Credit Card</option><option>Personal Loan</option><option>Car Loan</option><option>Home Loan</option><option>Installment</option><option>Borrowed Money</option><option>Other</option></select></Field><Field label="Original Amount"><input className={inputClass} name="originalAmount" type="number" min="0.01" step="0.01" required defaultValue={initial?.originalAmount || ""} /></Field><Field label="Remaining Balance"><input className={inputClass} name="remainingBalance" type="number" min="0" step="0.01" required defaultValue={initial?.remainingBalance || ""} /></Field><Field label="Minimum Payment"><input className={inputClass} name="minimumPayment" type="number" min="0" step="0.01" required defaultValue={initial?.minimumPayment || ""} /></Field><Field label="Planned Payment"><input className={inputClass} name="plannedPayment" type="number" min="0" step="0.01" required defaultValue={initial?.plannedPayment || ""} /></Field><Field label="Interest Rate"><input className={inputClass} name="interestRate" type="number" min="0" step="0.01" defaultValue={initial?.interestRate || 0} /></Field><Field label="Due Date"><input className={inputClass} name="dueDate" type="date" required defaultValue={initial?.dueDate || data.state.profile.demoToday} /></Field><Field label="Notes"><input className={inputClass} name="notes" defaultValue={initial?.notes || ""} /></Field><div className="md:col-span-4 flex gap-2"><Button type="submit"><CheckCircle size={17} /> {initial ? "Save Debt" : "Add Debt"}</Button>{initial ? <Button variant="secondary" onClick={onDone}>Cancel</Button> : null}</div></form>;
}

function DebtPaymentForm({ debt }: { debt: Debt }) {
  const data = useActiveFinance();
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); data.actions.recordDebtPayment({ debtId: debt.id, amount: getNumber(form, "amount"), date: getString(form, "date"), paymentSource: getString(form, "paymentSource"), cutoffId: data.cutoff.id, notes: getString(form, "notes") }); event.currentTarget.reset(); };
  return <form className="mt-4 grid gap-2" onSubmit={submit}><div className="grid gap-2 sm:grid-cols-2"><input className={inputClass} name="amount" type="number" min="0.01" step="0.01" placeholder="Payment amount" required /><input className={inputClass} name="date" type="date" defaultValue={todayInputValue()} required /></div><input className={inputClass} name="paymentSource" placeholder="Payment source" defaultValue="Shared Money" /><input className={inputClass} name="notes" placeholder="Notes" /><Button type="submit" variant="secondary"><Plus size={16} /> Record Payment</Button></form>;
}

function SavingsPage() {
  const data = useActiveFinance();
  const transactions = buildTransactions(data.state).filter((transaction) => transaction.type === "Savings Contribution" || transaction.type === "Savings Withdrawal");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = getNumber(form, "amount");
    if (!Number.isFinite(amount) || amount <= 0) return;
    data.actions.addSavingsTransaction({
      amount,
      date: getString(form, "date"),
      type: "Contribution",
      cutoffId: data.cutoff.id,
      notes: getString(form, "notes")
    });
    event.currentTarget.reset();
  };
  return (
    <div className="grid gap-6">
      <PageHeader title="Savings" description="Record money saved and watch your total grow." />
      <SummaryCard label="Total Savings" value={formatCurrency(totalSavings(data.state))} icon={PiggyBank} tone="success" />
      <Panel>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}>
          <Field label="Amount"><input className={inputClass} name="amount" type="number" min="0.01" step="0.01" required /></Field>
          <Field label="Date"><input className={inputClass} name="date" type="date" defaultValue={todayInputValue()} required /></Field>
          <Field label="Notes (optional)"><input className={inputClass} name="notes" /></Field>
          <div className="md:col-span-3"><Button type="submit"><Plus size={17} /> Record Savings</Button></div>
        </form>
      </Panel>
      <Panel>
        <h2 className="text-lg font-semibold">Savings History</h2>
        <div className="mt-4 grid gap-2">
          {transactions.length ? transactions.map((transaction) => {
            const record = data.state.savingsTransactions.find((item) => "tx-" + item.id === transaction.id);
            return <LedgerRow key={transaction.id} left={record?.notes || transaction.description} meta={formatShortDate(transaction.date) + " | " + transaction.type} amount={transaction.type === "Savings Withdrawal" ? -transaction.amount : transaction.amount} />;
          }) : <EmptyState title="No savings recorded yet" description="Record an amount above to start adding to your savings." />}
        </div>
      </Panel>
    </div>
  );
}

function WishlistPage() {
  const data = useActiveFinance();
  const [editing, setEditing] = useState<WishlistItem | null>(null);
  const selected = data.state.wishlistItems[0];
  return <div className="grid gap-6"><PageHeader title="Planned Purchases / Wishlist" description="Compare planned cost, actual cost, and available cash before buying." /><Panel><WishlistForm key={editing?.id || "new-wish"} initial={editing} onDone={() => setEditing(null)} /></Panel>{selected ? <Panel><h2 className="text-lg font-semibold">Purchase Decision Card</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><MoneyRow label="Item Cost" value={selected.estimatedCost} /><MoneyRow label="Available Cash" value={data.incomeTotal - data.outflows} /><MoneyRow label="Safe to Spend" value={data.safe} /></div><div className="mt-4"><StatusBadge label={data.safe >= selected.estimatedCost ? "Affordable Within Current Plan" : data.incomeTotal - data.outflows >= selected.estimatedCost ? "Warning" : "Not Recommended Within Current Budget"} tone={data.safe >= selected.estimatedCost ? "success" : data.incomeTotal - data.outflows >= selected.estimatedCost ? "warning" : "danger"} /></div><p className="mt-3 text-xs text-slate-500">This is a household budgeting signal, not professional financial advice.</p></Panel> : null}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.state.wishlistItems.map((item) => <Panel key={item.id}><div className="flex items-start justify-between"><div><h2 className="font-semibold">{item.name}</h2><p className="text-sm text-slate-500">{item.priority} priority | {item.status}</p></div><ShoppingCart className="text-[#6c63f6]" size={22} /></div><div className="mt-4 grid gap-2 text-sm"><MoneyRow label="Estimated" value={item.estimatedCost} /><MoneyRow label="Saved" value={item.amountSaved} /><MoneyRow label="Per Cutoff" value={item.plannedContributionPerCutoff} />{item.actualCost ? <MoneyRow label={item.actualCost <= item.estimatedCost ? "Saved vs plan" : "Overspent vs plan"} value={Math.abs(item.estimatedCost - item.actualCost)} /> : null}</div><div className="mt-3"><ProgressBar value={savingsProgress(item.amountSaved, item.estimatedCost)} tone="accent" /></div><div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => data.actions.markWishlistPurchased(item.id, item.estimatedCost)} disabled={item.status === "Purchased"}><CheckCircle size={16} /> Mark Purchased</Button><Button variant="ghost" onClick={() => setEditing(item)} title="Edit item"><Pencil size={16} /></Button><Button variant="ghost" onClick={() => data.actions.deleteWishlistItem(item.id)} title="Delete item"><Trash2 size={16} /></Button></div></Panel>)}</div></div>;
}

function WishlistForm({ initial, onDone }: { initial?: WishlistItem | null; onDone: () => void }) {
  const data = useActiveFinance();
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const payload = { name: getString(form, "name"), estimatedCost: getNumber(form, "estimatedCost"), priority: getString(form, "priority") as WishlistItem["priority"], targetPurchaseDate: getString(form, "targetPurchaseDate"), amountSaved: getNumber(form, "amountSaved"), plannedContributionPerCutoff: getNumber(form, "plannedContributionPerCutoff"), status: getString(form, "status") as WishlistItem["status"], actualCost: getNumber(form, "actualCost") || undefined, notes: getString(form, "notes") }; data.actions.upsertWishlistItem(initial ? { ...payload, id: initial.id } : payload); event.currentTarget.reset(); onDone(); };
  return <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}><Field label="Item Name"><input className={inputClass} name="name" required defaultValue={initial?.name || ""} /></Field><Field label="Estimated Cost"><input className={inputClass} name="estimatedCost" type="number" min="0.01" step="0.01" required defaultValue={initial?.estimatedCost || ""} /></Field><Field label="Priority"><select className={inputClass} name="priority" defaultValue={initial?.priority || "Medium"}><option>High</option><option>Medium</option><option>Low</option></select></Field><Field label="Target Date"><input className={inputClass} name="targetPurchaseDate" type="date" required defaultValue={initial?.targetPurchaseDate || data.cutoff.payday} /></Field><Field label="Amount Saved"><input className={inputClass} name="amountSaved" type="number" min="0" step="0.01" defaultValue={initial?.amountSaved || 0} /></Field><Field label="Contribution / Cutoff"><input className={inputClass} name="plannedContributionPerCutoff" type="number" min="0" step="0.01" defaultValue={initial?.plannedContributionPerCutoff || 0} /></Field><Field label="Status"><select className={inputClass} name="status" defaultValue={initial?.status || "Planning"}><option>Planning</option><option>Saving</option><option>Ready to Buy</option><option>Purchased</option><option>Cancelled</option></select></Field><Field label="Actual Cost"><input className={inputClass} name="actualCost" type="number" min="0" step="0.01" defaultValue={initial?.actualCost || ""} /></Field><Field label="Notes"><input className={inputClass} name="notes" defaultValue={initial?.notes || ""} /></Field><div className="md:col-span-3 flex gap-2"><Button type="submit"><CheckCircle size={17} /> {initial ? "Save Item" : "Add Item"}</Button>{initial ? <Button variant="secondary" onClick={onDone}>Cancel</Button> : null}</div></form>;
}

function FamilySharePage() {
  const data = useActiveFinance();
  const [editing, setEditing] = useState<FamilyShare | null>(null);
  const personalCategories = data.categories.filter((category) => category.group === "personal");
  const food = data.categories.find((category) => category.name === "Food");
  const gas = data.categories.find((category) => category.name === "Gas");
  const parking = data.categories.find((category) => category.name === "Parking");
  return <div className="grid gap-6"><PageHeader title="Family Share" description="Track family support plus personal allowances, food, gas, and parking budget health." /><div className="grid gap-4 md:grid-cols-3">{personalCategories.map((category) => <SummaryCard key={category.id} label={category.name} value={formatCurrency(category.planned - categoryActual(data.expenses, category.name))} helper="Remaining personal money" icon={Heart} />)}{food ? <SummaryCard label="Daily Food Allowance" value={formatCurrency(Math.max(0, food.planned - categoryActual(data.expenses, food.name)) / daysRemaining(data.cutoff, data.state.profile.demoToday))} icon={Utensils} /> : null}{gas ? <SummaryCard label="Gas Remaining" value={formatCurrency(gas.planned - categoryActual(data.expenses, gas.name))} icon={Fuel} /> : null}{parking ? <SummaryCard label="Parking Remaining" value={formatCurrency(parking.planned - categoryActual(data.expenses, parking.name))} icon={Car} /> : null}</div><Panel><FamilyForm key={editing?.id || "new-family"} initial={editing} onDone={() => setEditing(null)} /></Panel><Panel><h2 className="text-lg font-semibold">Family Contributions</h2><div className="mt-4 grid gap-2">{data.familyShares.map((item) => <LedgerRow key={item.id} left={item.recipient} meta={item.relationship + " | " + formatShortDate(item.date)} amount={item.actualAmount || item.budget} action={<><Button variant="ghost" onClick={() => setEditing(item)} title="Edit family share"><Pencil size={16} /></Button><Button variant="ghost" onClick={() => data.actions.deleteFamilyShare(item.id)} title="Delete family share"><Trash2 size={16} /></Button></>} />)}</div></Panel></div>;
}

function FamilyForm({ initial, onDone }: { initial?: FamilyShare | null; onDone: () => void }) {
  const data = useActiveFinance();
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const payload = { recipient: getString(form, "recipient"), relationship: getString(form, "relationship"), budget: getNumber(form, "budget"), actualAmount: getNumber(form, "actualAmount"), date: getString(form, "date"), cutoffId: data.cutoff.id, notes: getString(form, "notes") }; data.actions.upsertFamilyShare(initial ? { ...payload, id: initial.id } : payload); event.currentTarget.reset(); onDone(); };
  return <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}><Field label="Recipient"><input className={inputClass} name="recipient" required defaultValue={initial?.recipient || ""} /></Field><Field label="Relationship"><select className={inputClass} name="relationship" defaultValue={initial?.relationship || "Parents"}><option>Parents</option><option>Parents-In-Law</option><option>Sibling</option><option>Household Contribution</option><option>Other</option></select></Field><Field label="Budget"><input className={inputClass} name="budget" type="number" min="0" step="0.01" required defaultValue={initial?.budget || ""} /></Field><Field label="Actual Amount Given"><input className={inputClass} name="actualAmount" type="number" min="0" step="0.01" defaultValue={initial?.actualAmount || 0} /></Field><Field label="Date"><input className={inputClass} name="date" type="date" required defaultValue={initial?.date || todayInputValue()} /></Field><Field label="Notes"><input className={inputClass} name="notes" defaultValue={initial?.notes || ""} /></Field><div className="md:col-span-3 flex gap-2"><Button type="submit"><CheckCircle size={17} /> {initial ? "Save Share" : "Add Share"}</Button>{initial ? <Button variant="secondary" onClick={onDone}>Cancel</Button> : null}</div></form>;
}

function ReportsPage() {
  const data = useActiveFinance();
  const [filter, setFilter] = useState("Current Cutoff");
  const dailySeries = dailyPlanSeries(data.dailyPlans, data.expenses);
  const cumulativeSeries = cumulativeDailySeries(data.dailyPlans, data.expenses);
  const allocation = data.categories.map((category) => ({ name: category.name, value: category.planned }));
  const monthly = calculateMonthlySummary(data.state, "2026-09");
  const performance = data.spendable ? ((data.spending - data.spendable) / data.spendable) * 100 : 0;
  return <div className="grid gap-6"><PageHeader title="Reports" description="Review planned vs actual, cumulative pace, allocation, monthly summary, and cutoff performance." actions={<select className={inputClass} value={filter} onChange={(event) => setFilter(event.target.value)}><option>Current Cutoff</option><option>Previous Cutoff</option><option>Month</option><option>Last 3 Months</option><option>Last 6 Months</option><option>Year</option><option>Custom Date Range</option></select>} /><div className="grid gap-4 md:grid-cols-4"><SummaryCard label="Planned Spendable" value={formatCurrency(data.spendable)} icon={Target} /><SummaryCard label="Actual Spending" value={formatCurrency(data.spending)} icon={Receipt} /><SummaryCard label={data.spending <= data.spendable ? "Spent Less Than Planned" : "Overspent"} value={formatCurrency(Math.abs(data.spendable - data.spending))} icon={data.spending <= data.spendable ? TrendingDown : TrendingUp} tone={data.spending <= data.spendable ? "success" : "danger"} /><SummaryCard label="Performance" value={Math.abs(performance).toFixed(1) + "%"} helper={performance <= 0 ? "below budget" : "over budget"} icon={ChartBar} /></div><div className="grid gap-6 xl:grid-cols-2"><ChartPanel title="Planned vs Actual"><ResponsiveContainer width="100%" height={280}><BarChart data={dailySeries}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis tickFormatter={(value) => String(Number(value) / 1000) + "k"} /><Tooltip formatter={(value) => formatCurrency(Number(value))} /><Bar dataKey="planned" fill="#6c63f6" name="Planned" radius={[6, 6, 0, 0]} /><Bar dataKey="actual" fill="#2cc5a7" name="Actual" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartPanel><ChartPanel title="Cumulative Spending"><ResponsiveContainer width="100%" height={280}><LineChart data={cumulativeSeries}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis tickFormatter={(value) => String(Number(value) / 1000) + "k"} /><Tooltip formatter={(value) => formatCurrency(Number(value))} /><Line type="monotone" dataKey="planned" stroke="#6c63f6" strokeWidth={3} name="Cumulative Planned" dot={false} /><Line type="monotone" dataKey="actual" stroke="#2cc5a7" strokeWidth={3} name="Cumulative Actual" dot={false} /></LineChart></ResponsiveContainer></ChartPanel><ChartPanel title="Budget Allocation"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={allocation} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>{allocation.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value))} /></PieChart></ResponsiveContainer></ChartPanel><ChartPanel title="September Monthly Summary"><div className="grid gap-2 text-sm"><MoneyRow label="Total Household Income" value={monthly.income} /><MoneyRow label="Total Planned Spending" value={monthly.planned} /><MoneyRow label="Total Actual Spending" value={monthly.actual} /><MoneyRow label="Remaining" value={monthly.remaining} strong /><MoneyRow label="Total Under / Over" value={Math.abs(monthly.planned - monthly.actual)} /></div></ChartPanel></div></div>;
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
  return <div className="grid gap-6"><PageHeader title="Transaction History" description="Centralized ledger across income, expenses, bill payments, debt payments, and savings movements." /><Panel><div className="grid gap-3 md:grid-cols-3"><input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ledger" /><select className={inputClass} value={type} onChange={(event) => setType(event.target.value)}><option>All</option><option>Income</option><option>Expense</option><option>Bill Payment</option><option>Debt Payment</option><option>Savings Contribution</option><option>Savings Withdrawal</option></select><select className={inputClass} value={cutoff} onChange={(event) => setCutoff(event.target.value)}><option value="All">All Cutoffs</option>{data.state.cutoffs.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div><div className="mt-4 grid gap-2">{filtered.map((transaction) => <div key={transaction.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[140px_1fr_170px_130px]"><p className="text-sm text-slate-500">{formatShortDate(transaction.date)}</p><div><p className="font-semibold">{transaction.description}</p><p className="text-sm text-slate-500">{transaction.category} | {transaction.person}</p></div><StatusBadge label={transaction.type} tone={transaction.type === "Income" ? "success" : transaction.type.includes("Savings") ? "accent" : transaction.type.includes("Debt") ? "warning" : "neutral"} /><p className="text-right font-semibold"><MoneyDisplay value={transaction.amount} /></p></div>)}</div></Panel></div>;
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
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    data.actions.updateProfile({ husbandName: getString(form, "husbandName"), wifeName: getString(form, "wifeName"), cutoff1Start: getNumber(form, "cutoff1Start"), cutoff1End: getNumber(form, "cutoff1End"), cutoff2Start: getNumber(form, "cutoff2Start"), cutoff2End: "end", theme: "light", demoToday: getString(form, "demoToday") });
  };
  return <div className="grid gap-6"><PageHeader title="Settings" description="Manage couple names, cutoff dates, and your saved budget data. The app stays in light lavender mode." /><Panel><form className="grid gap-3 md:grid-cols-3" onSubmit={submit}><Field label="Husband Name"><input className={inputClass} name="husbandName" defaultValue={data.state.profile.husbandName} /></Field><Field label="Wife Name"><input className={inputClass} name="wifeName" defaultValue={data.state.profile.wifeName} /></Field><Field label="Currency"><input className={inputClass} value="PHP" readOnly /></Field><Field label="Cutoff 1 Start"><input className={inputClass} name="cutoff1Start" type="number" min="1" max="31" defaultValue={data.state.profile.cutoff1Start} /></Field><Field label="Cutoff 1 End"><input className={inputClass} name="cutoff1End" type="number" min="1" max="31" defaultValue={data.state.profile.cutoff1End} /></Field><Field label="Cutoff 2 Start"><input className={inputClass} name="cutoff2Start" type="number" min="1" max="31" defaultValue={data.state.profile.cutoff2Start} /></Field><div className="rounded-lg border border-[#d8d3ff] bg-[#f8f7ff] px-3 py-2 text-sm font-semibold text-[#5b52e6]">Light lavender mode</div><Field label="Demo Today"><input className={inputClass} name="demoToday" type="date" defaultValue={data.state.profile.demoToday} /></Field><div className="flex items-end"><Button type="submit"><CheckCircle size={17} /> Save Settings</Button></div></form></Panel><Panel><h2 className="text-lg font-semibold">Data Management</h2><p className="mt-1 text-sm text-slate-500">Budget data syncs to Supabase after login and keeps a local cache on this device.</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={exportData}><ArrowDown size={17} /> Export Data</Button><Button variant="secondary" onClick={() => fileInputRef.current?.click()}><ArrowUp size={17} /> Import Data</Button><Button variant="danger" onClick={data.actions.resetDemoData}><Trash2 size={17} /> Reset All Data</Button></div><input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(event) => importData(event.target.files?.[0])} /></Panel><Panel><h2 className="text-lg font-semibold">Future Household Architecture</h2><div className="mt-3 grid gap-2 text-sm"><MoneyRow label="Household ID" value={0} /><p className="text-slate-600">Household: {data.state.household.id}</p><p className="text-slate-600">Husband user: {data.state.household.husbandUserId}</p><p className="text-slate-600">Wife user: {data.state.household.wifeUserId}</p></div></Panel></div>;
}
