import {
  ExpenseSchema,
  UpdateExpenseInputSchema,
  ExpenseInsertSchema,
  PettyCashSchema,
  PettyCashInsertSchemaType,
} from "src/entities/models/Expense";

export interface IExpenseRepository {
  getExpensesByDate: (
    date: Date,
    branch_id: string | undefined
  ) => Promise<{ expenses: ExpenseSchema[] }>;
  addExpense: (
    petty_cash_id: string,
    input: ExpenseInsertSchema
  ) => Promise<ExpenseSchema>;
  getPettyCashBalance: (
    date: Date,
    branch_id: string
  ) => Promise<PettyCashSchema | null>;
  updateExpense: (
    expense_id: string,
    data: UpdateExpenseInputSchema
  ) => Promise<ExpenseSchema>;
  updatePettyCash: (
    petty_cash_id: string,
    data: PettyCashInsertSchemaType
  ) => Promise<PettyCashSchema>;
}
