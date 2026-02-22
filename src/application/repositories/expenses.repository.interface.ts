import {
  ExpenseWithBranchRow,
  UpdateExpenseInput,
  CreateExpenseInput,
  PettyCashWithBranchRow,
  CreatePettyCashInput,
  PettyCash,
} from "src/entities/models/Expense";

export interface IExpenseRepository {
  getExpensesByDate: (
    date: string,
    branch_id: string | undefined,
  ) => Promise<ExpenseWithBranchRow[]>;
  addExpense: (
    petty_cash_id: string,
    input: CreateExpenseInput,
  ) => Promise<ExpenseWithBranchRow>;
  getPettyCashBalance: (
    date: string,
    branch_id: string | undefined,
  ) => Promise<PettyCashWithBranchRow | null>;
  updateExpense: (
    expense_id: string,
    data: UpdateExpenseInput,
  ) => Promise<ExpenseWithBranchRow>;
  updatePettyCash: (
    petty_cash_id: string,
    data: CreatePettyCashInput,
  ) => Promise<PettyCashWithBranchRow>;
  deleteExpense: (expense_id: string) => Promise<void>;
  recalculatePettyCash: (petty_cash: PettyCash) => Promise<void>;
}
