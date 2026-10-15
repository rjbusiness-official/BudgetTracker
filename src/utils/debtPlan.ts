import type { Debt, DebtPlanSettings } from "@/src/types/budget";

const cents = (value: number) => Math.round(Math.max(0, value) * 100);
export const monthlyRate = (debt: Debt) => Math.max(0, debt.interestRate) / (debt.interestRatePeriod === "Monthly" ? 100 : 1200);

// Cover minimums first; distribute extra money in the selected priority order.
export function allocateDebtBudget(debts: Debt[], settings: DebtPlanSettings) {
  const ordered = debts.filter(debt => debt.remainingBalance > 0).slice().sort((a, b) =>
    (settings.strategy === "snowball" ? a.remainingBalance - b.remainingBalance : monthlyRate(b) - monthlyRate(a)) || a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
  const minimums = ordered.map(debt => Math.min(cents(debt.remainingBalance), cents(debt.minimumPayment)));
  let available = cents(settings.monthlyBudget);
  const required = minimums.reduce((sum, value) => sum + value, 0);
  // A shortfall is explicit; no partial allocation is presented as a valid plan.
  if (available < required) return { allocations: ordered.map((debt, i) => ({ debt, minimum: minimums[i] / 100, payment: minimums[i] / 100 })), shortfall: (required - available) / 100, unused: 0 };
  available -= required;
  const allocations = ordered.map((debt, i) => {
    const extra = Math.min(available, cents(debt.remainingBalance) - minimums[i]);
    available -= extra;
    return { debt, minimum: minimums[i] / 100, payment: (minimums[i] + extra) / 100 };
  });
  return { allocations, shortfall: 0, unused: available / 100 };
}

export function projectDebtPayoff(debts: Debt[], settings: DebtPlanSettings) {
  let balances = debts.filter(debt => debt.remainingBalance > 0).map(debt => ({ ...debt }));
  let interest = 0;
  const schedule: { month: number; payment: number; interest: number; balance: number }[] = [];
  if (!balances.length) return { months: 0, interest: 0, schedule, reason: "" };
  for (let month = 1; month <= 600; month++) {
    const before = balances.reduce((sum, debt) => sum + cents(debt.remainingBalance), 0);
    let monthInterest = 0;
    balances = balances.map(debt => {
      const charge = Math.round(cents(debt.remainingBalance) * monthlyRate(debt));
      monthInterest += charge;
      return { ...debt, remainingBalance: (cents(debt.remainingBalance) + charge) / 100 };
    });
    const plan = allocateDebtBudget(balances, settings);
    if (plan.shortfall > 0) return { months: null, interest: interest / 100, schedule, reason: "Monthly budget does not cover all minimum payments." };
    const payments = new Map(plan.allocations.map(item => [item.debt.id, cents(item.payment)]));
    balances = balances.map(debt => ({ ...debt, remainingBalance: (cents(debt.remainingBalance) - (payments.get(debt.id) || 0)) / 100 })).filter(debt => debt.remainingBalance > 0);
    const after = balances.reduce((sum, debt) => sum + cents(debt.remainingBalance), 0);
    interest += monthInterest;
    schedule.push({ month, payment: plan.allocations.reduce((sum, item) => sum + cents(item.payment), 0) / 100, interest: monthInterest / 100, balance: after / 100 });
    if (!balances.length) return { months: month, interest: interest / 100, schedule, reason: "" };
    if (after >= before) return { months: null, interest: interest / 100, schedule, reason: "This budget does not reduce your total balance. Increase it or review your rates." };
  }
  return { months: null, interest: interest / 100, schedule, reason: "Payoff exceeds the 50-year projection limit." };
}

export interface DebtAmortizationRow {
  installment: number;
  dueDate: string;
  openingBalance: number;
  payment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
}

/** Forecast only: does not mutate balances or record payments. */
export function buildDebtAmortization(debt: Debt, firstDueDate = debt.dueDate) {
  const rows: DebtAmortizationRow[] = [];
  let balance = cents(debt.remainingBalance);
  const payment = cents(debt.plannedPayment || debt.minimumPayment);
  if (!balance) return { rows, reason: "", totalInterest: 0, totalPayments: 0 };
  if (!Number.isFinite(balance) || !Number.isFinite(payment) || payment <= 0 || !Number.isFinite(debt.interestRate) || debt.interestRate < 0) {
    return { rows, reason: "Enter a positive monthly payment and a valid interest rate to see the breakdown.", totalInterest: 0, totalPayments: 0 };
  }
  const [year, month, day] = firstDueDate.split("-").map(Number);
  if (!year || !month || !day) return { rows, reason: "Enter a valid first due date.", totalInterest: 0, totalPayments: 0 };
  let totalInterest = 0;
  let totalPayments = 0;
  for (let installment = 1; installment <= 600; installment++) {
    const interest = Math.round(balance * monthlyRate(debt));
    if (payment <= interest) return { rows, reason: "The monthly payment does not cover interest. Increase the payment to reduce the balance.", totalInterest: totalInterest / 100, totalPayments: totalPayments / 100 };
    const actualPayment = Math.min(payment, balance + interest);
    const principal = actualPayment - interest;
    const date = new Date(year, month - 1 + installment - 1, 1);
    const dueDay = Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
    const dueDate = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(dueDay).padStart(2, "0");
    const openingBalance = balance;
    balance -= principal;
    totalInterest += interest;
    totalPayments += actualPayment;
    rows.push({ installment, dueDate, openingBalance: openingBalance / 100, payment: actualPayment / 100, interest: interest / 100, principal: principal / 100, remainingBalance: balance / 100 });
    if (balance === 0) return { rows, reason: "", totalInterest: totalInterest / 100, totalPayments: totalPayments / 100 };
  }
  return { rows, reason: "The schedule exceeds 600 monthly payments. Increase your monthly payment to see a complete payoff schedule.", totalInterest: totalInterest / 100, totalPayments: totalPayments / 100 };
}
