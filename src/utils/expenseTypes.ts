import type { BudgetState } from "@/src/types/budget";

export const defaultExpenseTypes = ["Food", "Transpo", "Gas", "Item", "others"];

export function normalizeExpenseTypes(types: string[]) {
  const seen = new Set<string>();
  return types.map(type => type.trim()).filter(type => {
    const key = type.toLowerCase();
    if (!type || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function expenseTypes(state: BudgetState): string[] {
  return normalizeExpenseTypes(state.expenseTypes ?? defaultExpenseTypes);
}
