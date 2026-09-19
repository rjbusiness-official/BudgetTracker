export type Person = "Ruru" | "Joselle" | "Shared";
export type IncomePerson = "Husband" | "Wife" | "Shared";
export type ThemeMode = "light";
export type PaymentMethod =
  | "Cash"
  | "GCash"
  | "Maya"
  | "Bank Transfer"
  | "Debit Card"
  | "Credit Card"
  | "Other";

export interface User {
  id: string;
  householdId: string;
  name: string;
  role: "husband" | "wife";
}

export interface Household {
  id: string;
  name: string;
  husbandUserId: string;
  wifeUserId: string;
}

export interface CoupleProfile {
  husbandName: string;
  wifeName: string;
  currency: "PHP";
  cutoff1Start: number;
  cutoff1End: number;
  cutoff2Start: number;
  cutoff2End: "end" | number;
  theme: ThemeMode;
  demoToday: string;
}

export interface Cutoff {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  payday: string;
  status: "previous" | "current" | "future";
}

export interface Income {
  id: string;
  source: string;
  person: IncomePerson;
  amount: number;
  date: string;
  cutoffId: string;
  type: "Salary" | "Overtime" | "Bonus" | "Freelance" | "Business" | "Commission" | "Government Loan" | "Other";
  notes?: string;
}

export interface SalaryAllocation {
  id: string;
  incomeId: string;
  category: string;
  amount: number;
}

export interface SalarySavingsRecord {
  id: string;
  incomeId: string;
  nextIncomeId: string;
  amount: number;
  date: string;
  note: string;
}

export type BudgetGroup = "reserved" | "spendable" | "savings" | "personal" | "custom";

export interface BudgetCategory {
  id: string;
  name: string;
  planned: number;
  group: BudgetGroup;
  cutoffId: string;
  locked?: boolean;
}

export interface DailyCategoryBudget {
  categoryId: string;
  planned: number;
}

export interface DailyBudget {
  id: string;
  date: string;
  cutoffId: string;
  planned: number;
  carriedForward?: number;
  categoryPlans: DailyCategoryBudget[];
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  paidBy: "Ruru" | "Joselle" | "Shared Money";
  date: string;
  paymentMethod: PaymentMethod;
  cutoffId: string;
  notes?: string;
  billId?: string;
  wishlistItemId?: string;
}

export interface Bill {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  assignedCutoffId: string;
  frequency: "Monthly" | "Weekly" | "Quarterly" | "Yearly" | "One-Time";
  status: "Pending" | "Paid" | "Overdue";
  autoInclude: boolean;
  notes?: string;
}

export interface Debt {
  id: string;
  name: string;
  creditor: string;
  type: "Credit Card" | "Personal Loan" | "Car Loan" | "Home Loan" | "Installment" | "Borrowed Money" | "Other";
  originalAmount: number;
  remainingBalance: number;
  minimumPayment: number;
  plannedPayment: number;
  interestRate: number;
  dueDate: string;
  assignedCutoffId: string;
  notes?: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  paymentSource: string;
  cutoffId: string;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSavings: number;
  contributionThisCutoff: number;
  targetDate: string;
  notes?: string;
}

export interface SavingsTransaction {
  id: string;
  goalId?: string;
  amount: number;
  date: string;
  type: "Contribution" | "Withdrawal";
  cutoffId: string;
  notes?: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  estimatedCost: number;
  priority: "High" | "Medium" | "Low";
  targetPurchaseDate: string;
  amountSaved: number;
  plannedContributionPerCutoff: number;
  status: "Planning" | "Saving" | "Ready to Buy" | "Purchased" | "Cancelled";
  actualCost?: number;
  notes?: string;
}

export interface FamilyShare {
  id: string;
  recipient: string;
  relationship: string;
  budget: number;
  actualAmount: number;
  date: string;
  cutoffId: string;
  notes?: string;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: "Weekly" | "Monthly" | "Quarterly" | "Yearly";
  assignedCutoff: "Cutoff 1" | "Cutoff 2" | "Both";
  startDate: string;
  active: boolean;
}

export type TransactionType =
  | "Income"
  | "Expense"
  | "Bill Payment"
  | "Debt Payment"
  | "Savings Contribution"
  | "Savings Withdrawal";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  category: string;
  person: string;
  amount: number;
  cutoffId: string;
}

export interface BudgetState {
  users: User[];
  household: Household;
  profile: CoupleProfile;
  cutoffs: Cutoff[];
  activeCutoffId: string;
  incomes: Income[];
  salaryAllocations: SalaryAllocation[];
  salarySavingsRecords: SalarySavingsRecord[];
  budgetCategories: BudgetCategory[];
  dailyBudgets: DailyBudget[];
  expenses: Expense[];
  bills: Bill[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  savingsGoals: SavingsGoal[];
  savingsTransactions: SavingsTransaction[];
  wishlistItems: WishlistItem[];
  familyShares: FamilyShare[];
  recurringTransactions: RecurringTransaction[];
}
