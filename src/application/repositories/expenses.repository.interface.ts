import {
  ExpenseSchema,
  UpdateExpenseInputSchema,
  ExpenseInsertSchema,
  PettyCashSchema,
  PettyCashInsertSchemaType,
} from "src/entities/models/Expense";

export interface IExpenseRepository {
  getExpensesByDate: (
    date: string,
    branch_id: string | undefined,
  ) => Promise<ExpenseSchema[]>;
  addExpense: (
    petty_cash_id: string,
    input: ExpenseInsertSchema,
  ) => Promise<ExpenseSchema>;
  getPettyCashBalance: (
    date: string,
    branch_id: string | undefined,
  ) => Promise<PettyCashSchema | null>;
  updateExpense: (
    expense_id: string,
    data: UpdateExpenseInputSchema,
  ) => Promise<ExpenseSchema>;
  updatePettyCash: (
    petty_cash_id: string,
    data: PettyCashInsertSchemaType,
  ) => Promise<PettyCashSchema>;
  deleteExpense: (expense_id: string) => Promise<void>;
}
