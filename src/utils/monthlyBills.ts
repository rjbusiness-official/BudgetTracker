import type { BudgetState } from "@/src/types/budget";

export const defaultMonthlyBillCategories = ["Electricity", "Water", "Internet", "Entertainment"];

export function normalizeBillCategories(categories: string[]) {
  const seen = new Set<string>();
  return categories.map(name => name.trim()).filter(name => {
    const key = name.toLowerCase();
    if (!name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function monthlyBillCategories(state: BudgetState): string[] {
  return normalizeBillCategories(state.monthlyBillCategories ?? [...defaultMonthlyBillCategories, ...state.bills.map(bill => bill.name)]);
}
