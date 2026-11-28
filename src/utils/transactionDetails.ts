import type { BudgetState, Transaction } from "@/src/types/budget";

const personName = (person?: string) => person === "Husband" ? "Ruru" : person === "Wife" ? "Joselle" : person === "Shared" ? "Shared Money" : person;

export function transactionDetails(state: BudgetState, transaction: Transaction) {
  const id = transaction.id.replace(/^tx-/, "");
  let vendor: string | undefined;
  let comments: string | undefined;
  let wallet: string | undefined;
  let destination: string | undefined;
  let person = personName(transaction.person);
  let payee: string | undefined;
  switch (transaction.type) {
    case "Expense":
    case "Bill Payment": {
      const record = state.expenses.find(item => item.id === id);
      vendor = record?.name;
      comments = record?.notes;
      wallet = record?.paymentMethod;
      person = record?.paidBy;
      payee = record?.payeeName;
      break;
    }
    case "Income": {
      const record = state.incomes.find(item => item.id === id);
      vendor = record?.source;
      comments = record?.notes;
      destination = record?.paymentMethod;
      person = personName(record?.person);
      break;
    }
    case "Debt Payment": {
      const record = state.debtPayments.find(item => item.id === id);
      const debt = state.debts.find(item => item.id === record?.debtId);
      vendor = debt?.name;
      payee = debt?.creditor;
      comments = record?.notes;
      const income = state.incomes.find(item => item.id === record?.incomeId);
      wallet = record?.paymentMethod || income?.paymentMethod;
      person = record?.person || personName(income?.person);
      break;
    }
    case "Savings Contribution":
    case "Savings Withdrawal": {
      const record = state.savingsTransactions.find(item => item.id === id);
      if (record) {
        const goal = state.savingsGoals.find(item => item.id === record.goalId);
        vendor = goal?.name || record.goalName || "Savings";
        comments = record.notes;
        person = record.person;
        if (transaction.type === "Savings Contribution") { wallet = record.paymentMethod; destination = vendor; }
        else { wallet = vendor; destination = record.paymentMethod; }
      } else {
        const saved = state.salarySavingsRecords.find(item => item.id === id);
        const income = state.incomes.find(item => item.id === saved?.incomeId);
        comments = saved?.note;
        wallet = income?.paymentMethod;
        person = personName(income?.person);
        destination = "Savings";
      }
      break;
    }
    case "Salary Allocation": {
      const record = state.salaryAllocations.find(item => item.id === id);
      const income = state.incomes.find(item => item.id === record?.incomeId);
      wallet = income?.paymentMethod;
      person = personName(income?.person);
      destination = record?.category.replace(/^(bill:|wish:)/, "");
      break;
    }
    case "Fund Transfer": {
      const record = state.fundTransfers?.find(item => item.id === id);
      wallet = record?.fromGoalId ? state.savingsGoals.find(item => item.id === record.fromGoalId)?.name || record.fromGoalName || "Savings" : record?.fromMethod;
      destination = record?.toGoalId ? state.savingsGoals.find(item => item.id === record.toGoalId)?.name || "Savings" : record?.toMethod;
      person = record?.person;
      payee = record?.toPerson || record?.person;
      comments = record?.notes;
      break;
    }
    case "Receivable": {
      const record = state.receivables?.find(item => item.id === id);
      vendor = record?.borrowerName;
      payee = record?.borrowerName;
      person = record?.person;
      wallet = record?.goalId ? state.savingsGoals.find(item => item.id === record.goalId)?.name || "Savings" : record?.paymentMethod;
      comments = record?.notes;
      break;
    }
    case "Receivable Repayment": {
      const record = state.receivablePayments?.find(item => item.id === id);
      vendor = state.receivables?.find(item => item.id === record?.receivableId)?.borrowerName;
      person = record?.person;
      destination = record?.goalId ? state.savingsGoals.find(item => item.id === record.goalId)?.name || record.goalName || "Savings" : record?.paymentMethod;
      break;
    }
  }
  return { vendor: vendor || transaction.description, comments: comments || "No comments", wallet: wallet || "Not recorded", destination, person: person || "Not recorded", payee };
}
