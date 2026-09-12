import type {
  Bill,
  BudgetCategory,
  BudgetState,
  Cutoff,
  DailyBudget,
  Debt,
  Expense,
  Income,
  SavingsTransaction,
  Transaction
} from "@/src/types/budget";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);

export const uid = (prefix: string) => prefix + "-" + Math.random().toString(36).slice(2, 9) + "-" + Date.now().toString(36);

export const toDate = (value: string) => new Date(value + "T00:00:00");

export const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(toDate(value));

export const formatLongDate = (value: string) =>
  new Intl.DateTimeFormat("en-PH", { month: "long", day: "numeric", year: "numeric" }).format(toDate(value));

export const eachDay = (startDate: string, endDate: string) => {
  const dates: string[] = [];
  const current = toDate(startDate);
  const end = toDate(endDate);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export const getActiveCutoff = (state: BudgetState) =>
  state.cutoffs.find((cutoff) => cutoff.id === state.activeCutoffId) ?? state.cutoffs[0];

export const categoriesForCutoff = (state: BudgetState, cutoffId: string) =>
  state.budgetCategories.filter((category) => category.cutoffId === cutoffId);

export const incomesForCutoff = (state: BudgetState, cutoffId: string) =>
  state.incomes.filter((income) => income.cutoffId === cutoffId);

export const expensesForCutoff = (state: BudgetState, cutoffId: string) =>
  state.expenses.filter((expense) => expense.cutoffId === cutoffId);

export const dailyPlansForCutoff = (state: BudgetState, cutoffId: string) =>
  state.dailyBudgets
    .filter((daily) => daily.cutoffId === cutoffId)
    .sort((a, b) => a.date.localeCompare(b.date));

export const totalIncome = (incomes: Income[]) => incomes.reduce((sum, item) => sum + item.amount, 0);

export const incomeByPerson = (incomes: Income[], person: "Husband" | "Wife" | "Shared") =>
  incomes.filter((income) => income.person === person).reduce((sum, item) => sum + item.amount, 0);

export const totalAllocation = (categories: BudgetCategory[]) => categories.reduce((sum, item) => sum + item.planned, 0);

export const plannedByGroup = (categories: BudgetCategory[], groups: BudgetCategory["group"][]) =>
  categories.filter((category) => groups.includes(category.group)).reduce((sum, category) => sum + category.planned, 0);

export const unallocatedMoney = (incomeTotal: number, categories: BudgetCategory[]) => incomeTotal - totalAllocation(categories);

export const reservedMoney = (categories: BudgetCategory[]) => plannedByGroup(categories, ["reserved"]);

export const protectedSavings = (categories: BudgetCategory[]) => plannedByGroup(categories, ["savings"]);

export const spendableBudget = (categories: BudgetCategory[]) => plannedByGroup(categories, ["spendable", "personal", "custom"]);

export const actualSpend = (expenses: Expense[]) => expenses.reduce((sum, item) => sum + item.amount, 0);

export const categoryActual = (expenses: Expense[], categoryName: string) =>
  expenses.filter((expense) => expense.category === categoryName).reduce((sum, expense) => sum + expense.amount, 0);

export const dailyActual = (expenses: Expense[], date: string) =>
  expenses.filter((expense) => expense.date === date).reduce((sum, expense) => sum + expense.amount, 0);

export const dailyDifference = (planned: number, actual: number) => planned - actual;

export const usagePercentage = (actual: number, planned: number) => planned <= 0 ? 0 : Math.min(999, (actual / planned) * 100);

export const categoryRemaining = (planned: number, actual: number) => planned - actual;

export const budgetHealth = (actual: number, planned: number) => {
  const usage = usagePercentage(actual, planned);
  if (actual > planned) return { label: "Over Budget", tone: "danger" as const };
  if (usage < 70) return { label: "Healthy", tone: "success" as const };
  if (usage <= 90) return { label: "Watch", tone: "warning" as const };
  return { label: "Tight", tone: "danger" as const };
};

export const dailyStatus = (planned: number, actual: number) => {
  if (planned <= 0 && actual <= 0) return { label: "No Plan", tone: "neutral" as const };
  if (planned <= 0) return { label: "Unplanned Spend", tone: "warning" as const };
  const ratio = actual / planned;
  if (ratio < 0.8) return { label: "Comfortably Under Budget", tone: "success" as const };
  if (ratio <= 1) return { label: "Within Budget", tone: "success" as const };
  if (ratio <= 1.1) return { label: "Slightly Over Budget", tone: "warning" as const };
  return { label: "Over Budget", tone: "danger" as const };
};

export const daysRemaining = (cutoff: Cutoff, today: string) => {
  const allDays = eachDay(cutoff.startDate, cutoff.endDate);
  return allDays.filter((date) => date >= today).length || 1;
};

export const futurePlanTotal = (dailyPlans: DailyBudget[], today: string) =>
  dailyPlans.filter((daily) => daily.date >= today).reduce((sum, daily) => sum + daily.planned, 0);

export const plannedUpToDate = (dailyPlans: DailyBudget[], today: string) =>
  dailyPlans.filter((daily) => daily.date <= today).reduce((sum, daily) => sum + daily.planned, 0);

export const actualUpToDate = (expenses: Expense[], today: string) =>
  expenses.filter((expense) => expense.date <= today).reduce((sum, expense) => sum + expense.amount, 0);

export const recommendedDailyBudget = (spendable: number, expenses: Expense[], cutoff: Cutoff, today: string) => {
  const actualToDate = actualUpToDate(expenses, today);
  const remaining = Math.max(0, spendable - actualToDate);
  return remaining / daysRemaining(cutoff, today);
};

export const safeToSpend = (spendable: number, dailyPlans: DailyBudget[], expenses: Expense[], today: string) => {
  const actualSoFar = actualUpToDate(expenses, today);
  const plannedRemaining = futurePlanTotal(dailyPlans, today);
  return spendable - actualSoFar - plannedRemaining;
};

export const savingsProgress = (current: number, target: number) => target <= 0 ? 0 : Math.min(100, (current / target) * 100);

export const debtProgress = (debt: Debt) => {
  const paid = Math.max(0, debt.originalAmount - debt.remainingBalance);
  return debt.originalAmount <= 0 ? 0 : Math.min(100, (paid / debt.originalAmount) * 100);
};

export const cumulativeDailySeries = (dailyPlans: DailyBudget[], expenses: Expense[]) => {
  let planned = 0;
  let actual = 0;
  return dailyPlans.map((daily) => {
    planned += daily.planned;
    actual += dailyActual(expenses, daily.date);
    return {
      date: formatShortDate(daily.date),
      planned,
      actual
    };
  });
};

export const dailyPlanSeries = (dailyPlans: DailyBudget[], expenses: Expense[]) =>
  dailyPlans.map((daily) => ({
    date: formatShortDate(daily.date),
    planned: daily.planned,
    actual: dailyActual(expenses, daily.date)
  }));

export const cutoffPerformancePercentage = (planned: number, actual: number) => planned <= 0 ? 0 : ((actual - planned) / planned) * 100;

export const billStatus = (bill: Bill, today: string) => {
  if (bill.status === "Paid") return "Paid";
  if (bill.dueDate < today) return "Overdue";
  return bill.status;
};

export const buildTransactions = (state: BudgetState): Transaction[] => {
  const incomeTx: Transaction[] = state.incomes.map((income) => ({
    id: "tx-" + income.id,
    date: income.date,
    description: income.source,
    type: "Income",
    category: income.type,
    person: income.person,
    amount: income.amount,
    cutoffId: income.cutoffId
  }));
  const expenseTx: Transaction[] = state.expenses.map((expense) => ({
    id: "tx-" + expense.id,
    date: expense.date,
    description: expense.name,
    type: expense.billId ? "Bill Payment" : "Expense",
    category: expense.category,
    person: expense.paidBy,
    amount: expense.amount,
    cutoffId: expense.cutoffId
  }));
  const debtTx: Transaction[] = state.debtPayments.map((payment) => {
    const debt = state.debts.find((item) => item.id === payment.debtId);
    return {
      id: "tx-" + payment.id,
      date: payment.date,
      description: debt ? debt.name + " payment" : "Debt payment",
      type: "Debt Payment",
      category: "Debt Payments",
      person: payment.paymentSource,
      amount: payment.amount,
      cutoffId: payment.cutoffId
    };
  });
  const savingsTx: Transaction[] = state.savingsTransactions.map((transaction) => {
    const goal = state.savingsGoals.find((item) => item.id === transaction.goalId);
    return {
      id: "tx-" + transaction.id,
      date: transaction.date,
      description: goal ? goal.name : "Savings",
      type: transaction.type === "Contribution" ? "Savings Contribution" : "Savings Withdrawal",
      category: "Savings",
      person: "Shared Money",
      amount: transaction.amount,
      cutoffId: transaction.cutoffId
    };
  });
  return [...incomeTx, ...expenseTx, ...debtTx, ...savingsTx].sort((a, b) => b.date.localeCompare(a.date));
};

export const amountIsValid = (value: number) => Number.isFinite(value) && value > 0 && Math.round(value * 100) === value * 100;

export const upcomingBills = (bills: Bill[], today: string) => {
  const todayDate = toDate(today);
  const plusSeven = new Date(todayDate);
  plusSeven.setDate(plusSeven.getDate() + 7);
  return {
    dueToday: bills.filter((bill) => bill.status !== "Paid" && bill.dueDate === today),
    dueThisWeek: bills.filter((bill) => bill.status !== "Paid" && toDate(bill.dueDate) > todayDate && toDate(bill.dueDate) <= plusSeven),
    overdue: bills.filter((bill) => bill.status !== "Paid" && bill.dueDate < today),
    upcoming: bills.filter((bill) => bill.status !== "Paid" && toDate(bill.dueDate) > plusSeven)
  };
};

export const calculateMonthlySummary = (state: BudgetState, monthPrefix: string) => {
  const cutoffIds = state.cutoffs.filter((cutoff) => cutoff.startDate.startsWith(monthPrefix)).map((cutoff) => cutoff.id);
  const incomes = state.incomes.filter((income) => cutoffIds.includes(income.cutoffId));
  const expenses = state.expenses.filter((expense) => cutoffIds.includes(expense.cutoffId));
  const categories = state.budgetCategories.filter((category) => cutoffIds.includes(category.cutoffId));
  return {
    income: totalIncome(incomes),
    planned: totalAllocation(categories),
    actual: actualSpend(expenses),
    remaining: totalIncome(incomes) - actualSpend(expenses),
    byCategory: categories.reduce<Record<string, number>>((acc, category) => {
      acc[category.name] = (acc[category.name] || 0) + category.planned;
      return acc;
    }, {})
  };
};

export const normalizeImportedState = (state: BudgetState): BudgetState => ({
  ...state,
  activeCutoffId: state.activeCutoffId || state.cutoffs[0]?.id || "",
  profile: { ...state.profile, currency: "PHP" }
});
