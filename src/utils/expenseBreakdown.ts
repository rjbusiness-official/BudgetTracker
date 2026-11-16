import type { Expense } from "@/src/types/budget";

export function expenseBreakdown(expenses: Expense[]) {
  const totals = new Map<string, { name: string; value: number; ruru: number; joselle: number; shared: number }>();
  for (const expense of expenses) {
    const name = expense.category || "Uncategorized";
    const row = totals.get(name) || { name, value: 0, ruru: 0, joselle: 0, shared: 0 };
    row.value += expense.amount;
    const owner = expense.paidBy === "Ruru" ? "ruru" : expense.paidBy === "Joselle" ? "joselle" : "shared";
    row[owner] += expense.amount;
    totals.set(name, row);
  }
  return Array.from(totals.values()).filter(item => item.value > 0).sort((a, b) => b.value - a.value);
}
