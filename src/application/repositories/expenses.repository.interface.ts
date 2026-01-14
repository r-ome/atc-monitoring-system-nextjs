import {
  ExpenseSchema,
  UpdateExpenseInputSchema,
  ExpenseInsertSchema,
} from "src/entities/models/Expense";

export interface IExpenseRepository {
  getExpensesByDate: (
    date: Date,
    branch_id: string | undefined
  ) => Promise<{ expenses: ExpenseSchema[] }>;
  addExpense: (input: ExpenseInsertSchema) => Promise<ExpenseSchema>;
  getPettyCashBalance: (date: Date) => Promise<ExpenseSchema | null>;
  updateExpense: (
    expense_id: string,
    data: UpdateExpenseInputSchema
  ) => Promise<ExpenseSchema>;
}
