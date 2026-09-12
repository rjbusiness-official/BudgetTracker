import type { BudgetCategory, BudgetState, DailyBudget } from "@/src/types/budget";

const currentCutoffId = "cutoff-2026-09-16";
const previousCutoffId = "cutoff-2026-09-01";

const currentCategories: BudgetCategory[] = [
  { id: "cat-debt", name: "Debt Payments", planned: 5000, group: "reserved", cutoffId: currentCutoffId, locked: true },
  { id: "cat-bills", name: "Monthly Bills", planned: 7000, group: "reserved", cutoffId: currentCutoffId, locked: true },
  { id: "cat-family", name: "Family Share", planned: 3000, group: "reserved", cutoffId: currentCutoffId, locked: true },
  { id: "cat-food", name: "Food", planned: 5000, group: "spendable", cutoffId: currentCutoffId, locked: true },
  { id: "cat-parking", name: "Parking", planned: 1200, group: "spendable", cutoffId: currentCutoffId, locked: true },
  { id: "cat-gas", name: "Gas", planned: 2800, group: "spendable", cutoffId: currentCutoffId, locked: true },
  { id: "cat-savings", name: "Savings", planned: 5000, group: "savings", cutoffId: currentCutoffId, locked: true },
  { id: "cat-purchases", name: "Planned Purchases", planned: 2000, group: "spendable", cutoffId: currentCutoffId, locked: true },
  { id: "cat-ruru", name: "Ruru Personal", planned: 1800, group: "personal", cutoffId: currentCutoffId, locked: true },
  { id: "cat-joselle", name: "Joselle Personal", planned: 1800, group: "personal", cutoffId: currentCutoffId, locked: true },
  { id: "cat-others", name: "Others", planned: 1500, group: "spendable", cutoffId: currentCutoffId, locked: true }
];

const previousCategories: BudgetCategory[] = [
  { id: "prev-debt", name: "Debt Payments", planned: 4800, group: "reserved", cutoffId: previousCutoffId, locked: true },
  { id: "prev-bills", name: "Monthly Bills", planned: 6800, group: "reserved", cutoffId: previousCutoffId, locked: true },
  { id: "prev-family", name: "Family Share", planned: 3000, group: "reserved", cutoffId: previousCutoffId, locked: true },
  { id: "prev-food", name: "Food", planned: 5000, group: "spendable", cutoffId: previousCutoffId, locked: true },
  { id: "prev-parking", name: "Parking", planned: 1200, group: "spendable", cutoffId: previousCutoffId, locked: true },
  { id: "prev-gas", name: "Gas", planned: 2600, group: "spendable", cutoffId: previousCutoffId, locked: true },
  { id: "prev-savings", name: "Savings", planned: 4500, group: "savings", cutoffId: previousCutoffId, locked: true },
  { id: "prev-purchases", name: "Planned Purchases", planned: 1800, group: "spendable", cutoffId: previousCutoffId, locked: true },
  { id: "prev-ruru", name: "Ruru Personal", planned: 1700, group: "personal", cutoffId: previousCutoffId, locked: true },
  { id: "prev-joselle", name: "Joselle Personal", planned: 1700, group: "personal", cutoffId: previousCutoffId, locked: true },
  { id: "prev-others", name: "Others", planned: 2000, group: "spendable", cutoffId: previousCutoffId, locked: true }
];

const currentDailyPlans: DailyBudget[] = [
  { id: "day-0916", date: "2026-09-16", cutoffId: currentCutoffId, planned: 800, categoryPlans: [] },
  { id: "day-0917", date: "2026-09-17", cutoffId: currentCutoffId, planned: 700, categoryPlans: [] },
  { id: "day-0918", date: "2026-09-18", cutoffId: currentCutoffId, planned: 1000, categoryPlans: [] },
  { id: "day-0919", date: "2026-09-19", cutoffId: currentCutoffId, planned: 1500, categoryPlans: [] },
  { id: "day-0920", date: "2026-09-20", cutoffId: currentCutoffId, planned: 1000, categoryPlans: [
    { categoryId: "cat-food", planned: 420 },
    { categoryId: "cat-gas", planned: 500 },
    { categoryId: "cat-parking", planned: 150 },
    { categoryId: "cat-ruru", planned: 50 }
  ] },
  { id: "day-0921", date: "2026-09-21", cutoffId: currentCutoffId, planned: 950, categoryPlans: [] },
  { id: "day-0922", date: "2026-09-22", cutoffId: currentCutoffId, planned: 900, categoryPlans: [] },
  { id: "day-0923", date: "2026-09-23", cutoffId: currentCutoffId, planned: 1200, categoryPlans: [] },
  { id: "day-0924", date: "2026-09-24", cutoffId: currentCutoffId, planned: 850, categoryPlans: [] },
  { id: "day-0925", date: "2026-09-25", cutoffId: currentCutoffId, planned: 1250, categoryPlans: [] },
  { id: "day-0926", date: "2026-09-26", cutoffId: currentCutoffId, planned: 950, categoryPlans: [] },
  { id: "day-0927", date: "2026-09-27", cutoffId: currentCutoffId, planned: 1100, categoryPlans: [] },
  { id: "day-0928", date: "2026-09-28", cutoffId: currentCutoffId, planned: 850, categoryPlans: [] },
  { id: "day-0929", date: "2026-09-29", cutoffId: currentCutoffId, planned: 1050, categoryPlans: [] },
  { id: "day-0930", date: "2026-09-30", cutoffId: currentCutoffId, planned: 2000, categoryPlans: [] }
];

const previousDailyPlans: DailyBudget[] = Array.from({ length: 15 }, (_, index) => ({
  id: "prev-day-" + String(index + 1).padStart(2, "0"),
  date: "2026-09-" + String(index + 1).padStart(2, "0"),
  cutoffId: previousCutoffId,
  planned: index % 5 === 0 ? 1250 : 980,
  categoryPlans: []
}));

export const createDemoBudgetState = (): BudgetState => ({
  users: [
    { id: "user-ruru", householdId: "household-ruru-joselle", name: "Ruru", role: "husband" },
    { id: "user-joselle", householdId: "household-ruru-joselle", name: "Joselle", role: "wife" }
  ],
  household: {
    id: "household-ruru-joselle",
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
    demoToday: "2026-09-20"
  },
  cutoffs: [
    { id: previousCutoffId, label: "September 1-15, 2026", startDate: "2026-09-01", endDate: "2026-09-15", payday: "2026-09-15", status: "previous" },
    { id: currentCutoffId, label: "September 16-30, 2026", startDate: "2026-09-16", endDate: "2026-09-30", payday: "2026-09-30", status: "current" }
  ],
  activeCutoffId: currentCutoffId,
  incomes: [
    { id: "inc-ruru-salary", source: "Ruru take-home income", person: "Husband", amount: 24500, date: "2026-09-16", cutoffId: currentCutoffId, type: "Salary", notes: "Net amount received for this cutoff" },
    { id: "inc-joselle-salary", source: "Joselle take-home income", person: "Wife", amount: 18700, date: "2026-09-16", cutoffId: currentCutoffId, type: "Salary", notes: "Net of taxes and deductions from a 20k cutoff salary" },
    { id: "inc-side", source: "Weekend freelance", person: "Shared", amount: 3000, date: "2026-09-18", cutoffId: previousCutoffId, type: "Freelance" },
    { id: "inc-prev-ruru", source: "Ruru take-home income", person: "Husband", amount: 23800, date: "2026-09-01", cutoffId: previousCutoffId, type: "Salary", notes: "Previous cutoff net income" },
    { id: "inc-prev-joselle", source: "Joselle take-home income", person: "Wife", amount: 18600, date: "2026-09-01", cutoffId: previousCutoffId, type: "Salary", notes: "Previous cutoff net income after deductions" }
  ],
  budgetCategories: [...previousCategories, ...currentCategories],
  dailyBudgets: [...previousDailyPlans, ...currentDailyPlans],
  expenses: [
    { id: "exp-1", name: "Groceries at supermarket", amount: 1680, category: "Food", paidBy: "Shared Money", date: "2026-09-16", paymentMethod: "Debit Card", cutoffId: currentCutoffId, notes: "Meat, vegetables, pantry" },
    { id: "exp-2", name: "Parking near office", amount: 150, category: "Parking", paidBy: "Ruru", date: "2026-09-16", paymentMethod: "Cash", cutoffId: currentCutoffId },
    { id: "exp-3", name: "Lunch for two", amount: 420, category: "Food", paidBy: "Shared Money", date: "2026-09-17", paymentMethod: "GCash", cutoffId: currentCutoffId },
    { id: "exp-4", name: "Gas refill", amount: 1850, category: "Gas", paidBy: "Shared Money", date: "2026-09-18", paymentMethod: "Credit Card", cutoffId: currentCutoffId },
    { id: "exp-5", name: "Coffee and snacks", amount: 260, category: "Food", paidBy: "Joselle", date: "2026-09-18", paymentMethod: "Maya", cutoffId: currentCutoffId },
    { id: "exp-6", name: "Parents household share", amount: 2500, category: "Family Share", paidBy: "Shared Money", date: "2026-09-19", paymentMethod: "Bank Transfer", cutoffId: currentCutoffId },
    { id: "exp-7", name: "Internet bill", amount: 1899, category: "Monthly Bills", paidBy: "Shared Money", date: "2026-09-19", paymentMethod: "Bank Transfer", cutoffId: currentCutoffId, billId: "bill-internet" },
    { id: "exp-8", name: "Work lunch", amount: 250, category: "Food", paidBy: "Ruru", date: "2026-09-20", paymentMethod: "Cash", cutoffId: currentCutoffId },
    { id: "exp-9", name: "Gas top up", amount: 500, category: "Gas", paidBy: "Shared Money", date: "2026-09-20", paymentMethod: "GCash", cutoffId: currentCutoffId },
    { id: "exp-10", name: "Parking", amount: 150, category: "Parking", paidBy: "Ruru", date: "2026-09-20", paymentMethod: "Cash", cutoffId: currentCutoffId },
    { id: "exp-11", name: "Joselle personal skincare", amount: 650, category: "Joselle Personal", paidBy: "Joselle", date: "2026-09-20", paymentMethod: "Debit Card", cutoffId: currentCutoffId },
    { id: "exp-prev-1", name: "Previous cutoff groceries", amount: 6200, category: "Food", paidBy: "Shared Money", date: "2026-09-05", paymentMethod: "Debit Card", cutoffId: previousCutoffId },
    { id: "exp-prev-2", name: "Previous cutoff gas", amount: 3200, category: "Gas", paidBy: "Shared Money", date: "2026-09-09", paymentMethod: "Credit Card", cutoffId: previousCutoffId },
    { id: "exp-prev-3", name: "Family support", amount: 5000, category: "Family Share", paidBy: "Shared Money", date: "2026-09-12", paymentMethod: "Bank Transfer", cutoffId: previousCutoffId }
  ],
  bills: [
    { id: "bill-electricity", name: "Electricity", category: "Utilities", amount: 4500, dueDate: "2026-09-23", assignedCutoffId: currentCutoffId, frequency: "Monthly", status: "Pending", autoInclude: true, notes: "Usually varies by usage" },
    { id: "bill-water", name: "Water", category: "Utilities", amount: 850, dueDate: "2026-09-27", assignedCutoffId: currentCutoffId, frequency: "Monthly", status: "Pending", autoInclude: true },
    { id: "bill-internet", name: "Internet", category: "Subscriptions", amount: 1899, dueDate: "2026-09-19", assignedCutoffId: currentCutoffId, frequency: "Monthly", status: "Paid", autoInclude: true },
    { id: "bill-netflix", name: "Netflix", category: "Subscriptions", amount: 549, dueDate: "2026-09-30", assignedCutoffId: currentCutoffId, frequency: "Monthly", status: "Pending", autoInclude: false }
  ],
  debts: [
    { id: "debt-card", name: "Credit Card", creditor: "Metrobank", type: "Credit Card", originalAmount: 50000, remainingBalance: 30000, minimumPayment: 2500, plannedPayment: 5000, interestRate: 2.8, dueDate: "2026-09-25", assignedCutoffId: currentCutoffId, notes: "Prioritize after bills" },
    { id: "debt-phone", name: "Phone Installment", creditor: "Store Plan", type: "Installment", originalAmount: 24000, remainingBalance: 12000, minimumPayment: 2000, plannedPayment: 3000, interestRate: 0, dueDate: "2026-09-28", assignedCutoffId: currentCutoffId }
  ],
  debtPayments: [
    { id: "dp-1", debtId: "debt-card", amount: 3000, date: "2026-09-17", paymentSource: "Shared Money", cutoffId: currentCutoffId, notes: "First half of planned payment" },
    { id: "dp-prev", debtId: "debt-phone", amount: 2000, date: "2026-09-10", paymentSource: "Shared Money", cutoffId: previousCutoffId }
  ],
  savingsGoals: [
    { id: "save-emergency", name: "Emergency Fund", targetAmount: 100000, currentSavings: 35000, contributionThisCutoff: 7000, targetDate: "2027-03-31", notes: "Keep protected" },
    { id: "save-travel", name: "Travel Fund", targetAmount: 60000, currentSavings: 18500, contributionThisCutoff: 3000, targetDate: "2027-05-15" }
  ],
  savingsTransactions: [
    { id: "st-1", goalId: "save-emergency", amount: 5000, date: "2026-09-16", type: "Contribution", cutoffId: currentCutoffId, notes: "Protected savings" },
    { id: "st-2", goalId: "save-travel", amount: 2000, date: "2026-09-18", type: "Contribution", cutoffId: currentCutoffId }
  ],
  wishlistItems: [
    { id: "wish-fridge", name: "New Refrigerator", estimatedCost: 35000, priority: "High", targetPurchaseDate: "2026-12-15", amountSaved: 12000, plannedContributionPerCutoff: 3000, status: "Saving", notes: "Replace old unit before holidays" },
    { id: "wish-vacation", name: "Beach Vacation", estimatedCost: 28000, priority: "Medium", targetPurchaseDate: "2027-04-01", amountSaved: 8500, plannedContributionPerCutoff: 2000, status: "Planning" }
  ],
  familyShares: [
    { id: "family-parents", recipient: "Ruru's Parents", relationship: "Parents", budget: 2500, actualAmount: 2500, date: "2026-09-19", cutoffId: currentCutoffId, notes: "Monthly help" },
    { id: "family-inlaws", recipient: "Joselle's Parents", relationship: "Parents-In-Law", budget: 2500, actualAmount: 0, date: "2026-09-27", cutoffId: currentCutoffId, notes: "Scheduled" }
  ],
  recurringTransactions: [
    { id: "rec-internet", name: "Internet", amount: 1899, category: "Monthly Bills", frequency: "Monthly", assignedCutoff: "Cutoff 2", startDate: "2026-01-01", active: true },
    { id: "rec-family", name: "Family Share", amount: 5000, category: "Family Share", frequency: "Monthly", assignedCutoff: "Both", startDate: "2026-01-01", active: true },
    { id: "rec-savings", name: "Emergency savings", amount: 5000, category: "Savings", frequency: "Monthly", assignedCutoff: "Both", startDate: "2026-01-01", active: true }
  ]
});
