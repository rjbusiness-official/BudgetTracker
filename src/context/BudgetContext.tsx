"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createDemoBudgetState } from "@/src/data/demoData";
import { useAuth } from "@/src/context/AuthContext";
import { supabase, supabaseHouseholdId } from "@/src/lib/supabase";
import type {
  Bill,
  BudgetCategory,
  BudgetState,
  CoupleProfile,
  DailyBudget,
  Debt,
  DebtPayment,
  Expense,
  FamilyShare,
  Income,
  SalarySavingsRecord,
  SavingsGoal,
  SavingsTransaction,
  WishlistItem
} from "@/src/types/budget";
import { eachDay, expensesForSalaryPeriod, getActiveCutoff, normalizeImportedState, uid } from "@/src/utils/finance";

const storageKey = "budget-tracker-v4-ruru-joselle-empty";

interface BudgetActions {
  setActiveCutoff: (cutoffId: string) => void;
  updateProfile: (profile: Partial<CoupleProfile>) => void;
  resetDemoData: () => void;
  importData: (state: BudgetState) => void;
  addIncome: (income: Omit<Income, "id">) => void;
  updateIncome: (income: Income) => void;
  deleteIncome: (id: string) => void;
  setSalaryAllocation: (incomeId: string, category: string, amount: number) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  updateCategory: (category: BudgetCategory) => void;
  addCategory: (category: Omit<BudgetCategory, "id">) => void;
  deleteCategory: (id: string) => void;
  copyPreviousBudget: () => void;
  setDailyPlan: (date: string, planned: number) => void;
  generateEqualDailyPlan: () => void;
  carryForwardUnused: (date: string) => void;
  upsertBill: (bill: Bill | Omit<Bill, "id">) => void;
  deleteBill: (id: string) => void;
  markBillPaid: (billId: string, createExpense: boolean) => void;
  upsertDebt: (debt: Debt | Omit<Debt, "id">) => void;
  deleteDebt: (id: string) => void;
  recordDebtPayment: (payment: Omit<DebtPayment, "id">) => void;
  upsertSavingsGoal: (goal: SavingsGoal | Omit<SavingsGoal, "id">) => void;
  deleteSavingsGoal: (id: string) => void;
  addSavingsTransaction: (transaction: Omit<SavingsTransaction, "id">) => void;
  upsertWishlistItem: (item: WishlistItem | Omit<WishlistItem, "id">) => void;
  deleteWishlistItem: (id: string) => void;
  markWishlistPurchased: (itemId: string, actualCost: number) => void;
  upsertFamilyShare: (item: FamilyShare | Omit<FamilyShare, "id">) => void;
  deleteFamilyShare: (id: string) => void;
}

interface BudgetSyncStatus {
  isLoading: boolean;
  isSaving: boolean;
  error: string;
  lastSavedAt: string | null;
  source: "local" | "supabase";
}

interface BudgetContextValue {
  state: BudgetState;
  actions: BudgetActions;
  sync: BudgetSyncStatus;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

const hasId = <T extends { id?: string }>(value: T): value is T & { id: string } => Boolean(value.id);

const legacyStorageKeys = [
  "cutoff-household-budget-v2-ruru-joselle",
  "budget-tracker-v3-ruru-joselle-clean"
];

const demoRecordIds = new Set([
  "inc-ruru-salary",
  "inc-joselle-salary",
  "inc-side",
  "inc-prev-ruru",
  "inc-prev-joselle",
  "cat-debt",
  "cat-bills",
  "cat-food",
  "prev-debt",
  "prev-bills",
  "prev-food",
  "exp-1",
  "exp-2",
  "exp-prev-1",
  "bill-electricity",
  "bill-internet",
  "debt-card",
  "debt-phone",
  "save-emergency",
  "save-travel",
  "wish-fridge",
  "wish-vacation",
  "family-parents",
  "family-inlaws",
  "rec-internet",
  "rec-family",
  "rec-savings"
]);

const demoArrayKeys = [
  "incomes",
  "salaryAllocations",
  "salarySavingsRecords",
  "budgetCategories",
  "dailyBudgets",
  "expenses",
  "bills",
  "debts",
  "debtPayments",
  "savingsGoals",
  "savingsTransactions",
  "wishlistItems",
  "familyShares",
  "recurringTransactions"
] as const;

const containsOldDemoData = (state: BudgetState) =>
  state.household?.id === "household-ruru-joselle" ||
  state.profile?.demoToday === "2026-09-20" ||
  demoArrayKeys.some((key) => state[key].some((item) => demoRecordIds.has(item.id)));

const isSalaryIncome = (income: Income) => income.type === "Salary" || income.source === "Salary";

const salaryIncomeRecords = (state: BudgetState) =>
  state.incomes.filter(isSalaryIncome).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

const salaryAllocationsFor = (state: BudgetState, incomeId: string) =>
  state.salaryAllocations.filter((allocation) => allocation.incomeId === incomeId);

const recalculateSalarySavingsRecords = (state: BudgetState): BudgetState => {
  const salaries = salaryIncomeRecords(state);
  const salaryIds = new Set(salaries.map((income) => income.id));
  const records: SalarySavingsRecord[] = [];

  salaries.forEach((salary, index) => {
    const nextSalary = salaries.slice(index + 1).find((income) => income.person === salary.person);
    if (!nextSalary) return;
    const allocated = salaryAllocationsFor(state, salary.id).reduce((sum, allocation) => sum + allocation.amount, 0);
    const spent = expensesForSalaryPeriod(state, salary, nextSalary).reduce((sum, expense) => sum + expense.amount, 0);
    const excess = Math.round(Math.max(0, salary.amount - allocated - spent) * 100) / 100;
    if (excess <= 0) return;
    records.push({
      id: "salary-saving-" + salary.id,
      incomeId: salary.id,
      nextIncomeId: nextSalary.id,
      amount: excess,
      date: nextSalary.date,
      note: "Excess money from previous salary"
    });
  });

  return {
    ...state,
    salaryAllocations: state.salaryAllocations.filter((allocation) => salaryIds.has(allocation.incomeId)),
    salarySavingsRecords: records
  };
};

const cleanIncomingState = (state: BudgetState) => {
  const normalized = normalizeImportedState(state);
  return recalculateSalarySavingsRecords(containsOldDemoData(normalized) ? createDemoBudgetState() : normalized);
};
const loadInitialState = () => {
  if (typeof window === "undefined") return createDemoBudgetState();
  try {
    legacyStorageKeys.forEach((key) => window.localStorage.removeItem(key));
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return createDemoBudgetState();
    return cleanIncomingState(JSON.parse(raw) as BudgetState);
  } catch {
    return createDemoBudgetState();
  }
};

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<BudgetState>(loadInitialState);
  const [remoteReady, setRemoteReady] = useState(!supabase);
  const [sync, setSync] = useState<BudgetSyncStatus>({
    isLoading: Boolean(supabase),
    isSaving: false,
    error: "",
    lastSavedAt: null,
    source: supabase ? "supabase" : "local"
  });

  useEffect(() => {
    if (!supabase || !user) {
      setRemoteReady(true);
      setSync((current) => ({ ...current, isLoading: false, source: "local" }));
      return;
    }

    let alive = true;
    setRemoteReady(false);
    setSync((current) => ({ ...current, isLoading: true, error: "", source: "supabase" }));

    supabase
      .from("household_budgets")
      .select("budget_state, updated_at")
      .eq("id", supabaseHouseholdId)
      .limit(1)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          setSync((current) => ({ ...current, isLoading: false, error: error.message }));
          setRemoteReady(true);
          return;
        }

        const remote = data?.[0] as { budget_state?: BudgetState; updated_at?: string } | undefined;
        if (remote?.budget_state) setState(cleanIncomingState(remote.budget_state));
        setSync((current) => ({ ...current, isLoading: false, error: "", lastSavedAt: remote?.updated_at || current.lastSavedAt }));
        setRemoteReady(true);
      });

    return () => {
      alive = false;
    };
  }, [user]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
    document.documentElement.classList.remove("dark");

    if (!supabase || !user || !remoteReady) return;

    setSync((current) => ({ ...current, isSaving: true, error: "" }));
    const timeout = window.setTimeout(() => {
      supabase
        .from("household_budgets")
        .upsert({
          id: supabaseHouseholdId,
          owner_id: user.id,
          budget_state: state,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" })
        .then(({ error }) => {
          setSync((current) => ({
            ...current,
            isSaving: false,
            error: error?.message || "",
            lastSavedAt: error ? current.lastSavedAt : new Date().toISOString(),
            source: "supabase"
          }));
        });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [remoteReady, state, user]);

  const setActiveCutoff = useCallback((cutoffId: string) => {
    setState((current) => ({ ...current, activeCutoffId: cutoffId }));
  }, []);

  const updateProfile = useCallback((profile: Partial<CoupleProfile>) => {
    setState((current) => ({ ...current, profile: { ...current.profile, ...profile, currency: "PHP", theme: "light" } }));
  }, []);

  const resetDemoData = useCallback(() => setState(createDemoBudgetState()), []);

  const importData = useCallback((nextState: BudgetState) => setState(cleanIncomingState(nextState)), []);

  const addIncome = useCallback((income: Omit<Income, "id">) => {
    setState((current) => recalculateSalarySavingsRecords({ ...current, incomes: [{ ...income, id: uid("income") }, ...current.incomes] }));
  }, []);

  const updateIncome = useCallback((income: Income) => {
    setState((current) => recalculateSalarySavingsRecords({ ...current, incomes: current.incomes.map((item) => item.id === income.id ? income : item) }));
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setState((current) => recalculateSalarySavingsRecords({ ...current, incomes: current.incomes.filter((item) => item.id !== id), salaryAllocations: current.salaryAllocations.filter((allocation) => allocation.incomeId !== id) }));
  }, []);

  const setSalaryAllocation = useCallback((incomeId: string, category: string, amount: number) => {
    setState((current) => {
      const trimmedCategory = category.trim();
      if (!trimmedCategory) return current;
      const existing = current.salaryAllocations.find((allocation) => allocation.incomeId === incomeId && allocation.category === trimmedCategory);
      const salaryAllocations = amount <= 0
        ? current.salaryAllocations.filter((allocation) => !(allocation.incomeId === incomeId && allocation.category === trimmedCategory))
        : existing
          ? current.salaryAllocations.map((allocation) => allocation.id === existing.id ? { ...allocation, amount } : allocation)
          : [{ id: uid("salaryalloc"), incomeId, category: trimmedCategory, amount }, ...current.salaryAllocations];
      return recalculateSalarySavingsRecords({ ...current, salaryAllocations });
    });
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    setState((current) => recalculateSalarySavingsRecords({ ...current, expenses: [{ ...expense, id: uid("expense") }, ...current.expenses] }));
  }, []);

  const updateExpense = useCallback((expense: Expense) => {
    setState((current) => recalculateSalarySavingsRecords({ ...current, expenses: current.expenses.map((item) => item.id === expense.id ? expense : item) }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setState((current) => recalculateSalarySavingsRecords({ ...current, expenses: current.expenses.filter((item) => item.id !== id) }));
  }, []);

  const updateCategory = useCallback((category: BudgetCategory) => {
    setState((current) => ({ ...current, budgetCategories: current.budgetCategories.map((item) => item.id === category.id ? category : item) }));
  }, []);

  const addCategory = useCallback((category: Omit<BudgetCategory, "id">) => {
    setState((current) => ({ ...current, budgetCategories: [...current.budgetCategories, { ...category, id: uid("category") }] }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState((current) => ({ ...current, budgetCategories: current.budgetCategories.filter((item) => item.id !== id) }));
  }, []);

  const copyPreviousBudget = useCallback(() => {
    setState((current) => {
      const activeIndex = current.cutoffs.findIndex((cutoff) => cutoff.id === current.activeCutoffId);
      const previous = current.cutoffs[Math.max(0, activeIndex - 1)];
      if (!previous || previous.id === current.activeCutoffId) return current;
      const previousCategories = current.budgetCategories.filter((category) => category.cutoffId === previous.id);
      const activeCategories = current.budgetCategories.filter((category) => category.cutoffId === current.activeCutoffId);
      const copied = [...current.budgetCategories];
      previousCategories.forEach((previousCategory) => {
        const existing = activeCategories.find((category) => category.name === previousCategory.name);
        if (existing) {
          const index = copied.findIndex((category) => category.id === existing.id);
          copied[index] = { ...existing, planned: previousCategory.planned, group: previousCategory.group };
        } else {
          copied.push({ ...previousCategory, id: uid("category"), cutoffId: current.activeCutoffId });
        }
      });
      return { ...current, budgetCategories: copied };
    });
  }, []);

  const setDailyPlan = useCallback((date: string, planned: number) => {
    setState((current) => ({
      ...current,
      dailyBudgets: current.dailyBudgets.map((daily) => daily.cutoffId === current.activeCutoffId && daily.date === date ? { ...daily, planned } : daily)
    }));
  }, []);

  const generateEqualDailyPlan = useCallback(() => {
    setState((current) => {
      const cutoff = getActiveCutoff(current);
      const categories = current.budgetCategories.filter((category) => category.cutoffId === cutoff.id);
      const spendable = categories
        .filter((category) => category.group === "spendable" || category.group === "personal" || category.group === "custom")
        .reduce((sum, category) => sum + category.planned, 0);
      const days = eachDay(cutoff.startDate, cutoff.endDate);
      const equal = Math.round((spendable / days.length) * 100) / 100;
      const existing = current.dailyBudgets.filter((daily) => daily.cutoffId !== cutoff.id);
      const generated: DailyBudget[] = days.map((date) => ({
        id: uid("daily"),
        date,
        cutoffId: cutoff.id,
        planned: equal,
        categoryPlans: []
      }));
      return { ...current, dailyBudgets: [...existing, ...generated] };
    });
  }, []);

  const carryForwardUnused = useCallback((date: string) => {
    setState((current) => {
      const expenses = current.expenses.filter((expense) => expense.cutoffId === current.activeCutoffId);
      const daily = current.dailyBudgets.find((item) => item.cutoffId === current.activeCutoffId && item.date === date);
      if (!daily) return current;
      const actual = expenses.filter((expense) => expense.date === date).reduce((sum, expense) => sum + expense.amount, 0);
      const unused = Math.max(0, daily.planned - actual);
      const futureDays = current.dailyBudgets.filter((item) => item.cutoffId === current.activeCutoffId && item.date > date);
      if (unused <= 0 || futureDays.length === 0) return current;
      const addPerDay = Math.round((unused / futureDays.length) * 100) / 100;
      return {
        ...current,
        dailyBudgets: current.dailyBudgets.map((item) => {
          if (item.id === daily.id) return { ...item, carriedForward: (item.carriedForward || 0) + unused };
          if (item.cutoffId === current.activeCutoffId && item.date > date) return { ...item, planned: item.planned + addPerDay };
          return item;
        })
      };
    });
  }, []);

  const upsertBill = useCallback((bill: Bill | Omit<Bill, "id">) => {
    setState((current) => {
      if (hasId(bill)) {
        return { ...current, bills: current.bills.map((item) => item.id === bill.id ? bill : item) };
      }
      return { ...current, bills: [{ ...bill, id: uid("bill") }, ...current.bills] };
    });
  }, []);

  const deleteBill = useCallback((id: string) => {
    setState((current) => ({ ...current, bills: current.bills.filter((bill) => bill.id !== id) }));
  }, []);

  const markBillPaid = useCallback((billId: string, createExpense: boolean) => {
    setState((current) => {
      const bill = current.bills.find((item) => item.id === billId);
      if (!bill) return current;
      const expenses = createExpense && !current.expenses.some((expense) => expense.billId === billId)
        ? [{ id: uid("expense"), name: bill.name, amount: bill.amount, category: "Monthly Bills", paidBy: "Shared Money" as const, date: bill.dueDate, paymentMethod: "Bank Transfer" as const, cutoffId: bill.assignedCutoffId, billId }, ...current.expenses]
        : current.expenses;
      return {
        ...current,
        bills: current.bills.map((item) => item.id === billId ? { ...item, status: "Paid" } : item),
        expenses
      };
    });
  }, []);

  const upsertDebt = useCallback((debt: Debt | Omit<Debt, "id">) => {
    setState((current) => {
      if (hasId(debt)) return { ...current, debts: current.debts.map((item) => item.id === debt.id ? debt : item) };
      return { ...current, debts: [{ ...debt, id: uid("debt") }, ...current.debts] };
    });
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setState((current) => ({ ...current, debts: current.debts.filter((debt) => debt.id !== id), debtPayments: current.debtPayments.filter((payment) => payment.debtId !== id) }));
  }, []);

  const recordDebtPayment = useCallback((payment: Omit<DebtPayment, "id">) => {
    setState((current) => ({
      ...current,
      debtPayments: [{ ...payment, id: uid("debtpay") }, ...current.debtPayments],
      debts: current.debts.map((debt) => debt.id === payment.debtId ? { ...debt, remainingBalance: Math.max(0, debt.remainingBalance - payment.amount) } : debt)
    }));
  }, []);

  const upsertSavingsGoal = useCallback((goal: SavingsGoal | Omit<SavingsGoal, "id">) => {
    setState((current) => {
      if (hasId(goal)) return { ...current, savingsGoals: current.savingsGoals.map((item) => item.id === goal.id ? goal : item) };
      return { ...current, savingsGoals: [{ ...goal, id: uid("goal") }, ...current.savingsGoals] };
    });
  }, []);

  const deleteSavingsGoal = useCallback((id: string) => {
    setState((current) => ({ ...current, savingsGoals: current.savingsGoals.filter((goal) => goal.id !== id), savingsTransactions: current.savingsTransactions.filter((transaction) => transaction.goalId !== id) }));
  }, []);

  const addSavingsTransaction = useCallback((transaction: Omit<SavingsTransaction, "id">) => {
    setState((current) => ({
      ...current,
      savingsTransactions: [{ ...transaction, id: uid("savingtx") }, ...current.savingsTransactions],
      savingsGoals: current.savingsGoals.map((goal) => {
        if (goal.id !== transaction.goalId) return goal;
        const delta = transaction.type === "Contribution" ? transaction.amount : -transaction.amount;
        return { ...goal, currentSavings: Math.max(0, goal.currentSavings + delta), contributionThisCutoff: transaction.type === "Contribution" ? goal.contributionThisCutoff + transaction.amount : goal.contributionThisCutoff };
      })
    }));
  }, []);

  const upsertWishlistItem = useCallback((item: WishlistItem | Omit<WishlistItem, "id">) => {
    setState((current) => {
      if (hasId(item)) return { ...current, wishlistItems: current.wishlistItems.map((wishlistItem) => wishlistItem.id === item.id ? item : wishlistItem) };
      return { ...current, wishlistItems: [{ ...item, id: uid("wish") }, ...current.wishlistItems] };
    });
  }, []);

  const deleteWishlistItem = useCallback((id: string) => {
    setState((current) => ({ ...current, wishlistItems: current.wishlistItems.filter((item) => item.id !== id) }));
  }, []);

  const markWishlistPurchased = useCallback((itemId: string, actualCost: number) => {
    setState((current) => {
      const item = current.wishlistItems.find((wishlistItem) => wishlistItem.id === itemId);
      if (!item) return current;
      const today = current.profile.demoToday;
      return {
        ...current,
        wishlistItems: current.wishlistItems.map((wishlistItem) => wishlistItem.id === itemId ? { ...wishlistItem, status: "Purchased", actualCost } : wishlistItem),
        expenses: [{ id: uid("expense"), name: item.name, amount: actualCost, category: "Planned Purchases", paidBy: "Shared Money", date: today, paymentMethod: "Bank Transfer", cutoffId: current.activeCutoffId, wishlistItemId: itemId }, ...current.expenses]
      };
    });
  }, []);

  const upsertFamilyShare = useCallback((item: FamilyShare | Omit<FamilyShare, "id">) => {
    setState((current) => {
      if (hasId(item)) return { ...current, familyShares: current.familyShares.map((share) => share.id === item.id ? item : share) };
      return { ...current, familyShares: [{ ...item, id: uid("family") }, ...current.familyShares] };
    });
  }, []);

  const deleteFamilyShare = useCallback((id: string) => {
    setState((current) => ({ ...current, familyShares: current.familyShares.filter((item) => item.id !== id) }));
  }, []);

  const actions = useMemo<BudgetActions>(() => ({
    setActiveCutoff,
    updateProfile,
    resetDemoData,
    importData,
    addIncome,
    updateIncome,
    deleteIncome,
    setSalaryAllocation,
    addExpense,
    updateExpense,
    deleteExpense,
    updateCategory,
    addCategory,
    deleteCategory,
    copyPreviousBudget,
    setDailyPlan,
    generateEqualDailyPlan,
    carryForwardUnused,
    upsertBill,
    deleteBill,
    markBillPaid,
    upsertDebt,
    deleteDebt,
    recordDebtPayment,
    upsertSavingsGoal,
    deleteSavingsGoal,
    addSavingsTransaction,
    upsertWishlistItem,
    deleteWishlistItem,
    markWishlistPurchased,
    upsertFamilyShare,
    deleteFamilyShare
  }), [
    setActiveCutoff,
    updateProfile,
    resetDemoData,
    importData,
    addIncome,
    updateIncome,
    deleteIncome,
    setSalaryAllocation,
    addExpense,
    updateExpense,
    deleteExpense,
    updateCategory,
    addCategory,
    deleteCategory,
    copyPreviousBudget,
    setDailyPlan,
    generateEqualDailyPlan,
    carryForwardUnused,
    upsertBill,
    deleteBill,
    markBillPaid,
    upsertDebt,
    deleteDebt,
    recordDebtPayment,
    upsertSavingsGoal,
    deleteSavingsGoal,
    addSavingsTransaction,
    upsertWishlistItem,
    deleteWishlistItem,
    markWishlistPurchased,
    upsertFamilyShare,
    deleteFamilyShare
  ]);

  return <BudgetContext.Provider value={{ state, actions, sync }}>{children}</BudgetContext.Provider>;
}

export const useBudget = () => {
  const value = useContext(BudgetContext);
  if (!value) throw new Error("useBudget must be used inside BudgetProvider");
  return value;
};
