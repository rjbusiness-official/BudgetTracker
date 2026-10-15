import type { BudgetState } from "@/src/types/budget";

export const budgetDataRevision = "empty-budget-2026-10-15";

const currentCutoffId = "cutoff-2026-09-01";
const nextCutoffId = "cutoff-2026-09-16";

export const createDemoBudgetState = (): BudgetState => ({
  dataRevision: budgetDataRevision,
  users: [
    { id: "user-ruru", householdId: "ruru-joselle-household", name: "Ruru", role: "husband" },
    { id: "user-joselle", householdId: "ruru-joselle-household", name: "Joselle", role: "wife" }
  ],
  household: {
    id: "ruru-joselle-household",
    name: "Ruru and Joselle Household",
    husbandUserId: "user-ruru",
    wifeUserId: "user-joselle"
  },
  profile: {
    husbandName: "Ruru",
    wifeName: "Joselle",
    currency: "PHP",
    cutoff1Start: 1,
    cutoff1End: 15,
    cutoff2Start: 16,
    cutoff2End: "end",
    theme: "light",
    demoToday: "2026-09-12"
  },
  cutoffs: [
    {
      id: currentCutoffId,
      label: "September 1-15, 2026",
      startDate: "2026-09-01",
      endDate: "2026-09-15",
      payday: "2026-09-15",
      status: "current"
    },
    {
      id: nextCutoffId,
      label: "September 16-30, 2026",
      startDate: "2026-09-16",
      endDate: "2026-09-30",
      payday: "2026-09-30",
      status: "future"
    }
  ],
  activeCutoffId: currentCutoffId,
  incomes: [],
  salaryAllocations: [],
  salarySavingsRecords: [],
  budgetCategories: [],
  dailyBudgets: [],
  expenses: [],
  bills: [],
  debts: [],
  debtPayments: [],
  savingsGoals: [],
  savingsTransactions: [],
  wishlistItems: [],
  vacationPlans: [],
  familyShares: [],
  recurringTransactions: []
});

// Reset pre-release data once; later saves retain the revision and their records.
export const resetOutdatedBudget = (state: BudgetState): BudgetState =>
  state.dataRevision === budgetDataRevision ? state : createDemoBudgetState();
