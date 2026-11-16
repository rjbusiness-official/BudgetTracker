import type { BudgetState } from "@/src/types/budget";

export function incomeBreakdown(state: BudgetState, month: string) {
  // Repayments can also have a linked income entry; count the repayment once.
  const linkedIds = new Set((state.receivablePayments || []).map(item => item.incomeId).filter(Boolean));
  let salary = 0;
  let extra = 0;
  for (const item of state.incomes) {
    if (!month || !item.date.startsWith(month) || linkedIds.has(item.id)) continue;
    if (item.type === "Salary" || item.source === "Salary") salary += item.amount;
    else extra += item.amount;
  }
  const receivables = (state.receivablePayments || []).filter(item => month && item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
  const total = salary + extra + receivables;
  return {
    total,
    shares: [{ name: "Salary", value: salary }, { name: "Extra Money", value: extra }, { name: "Receivables", value: receivables }].map(item => ({ ...item, percentage: total > 0 ? item.value / total * 100 : 0 }))
  };
}
