import {
  ExpenseSchema,
  ExpenseInsertSchema,
} from "src/entities/models/Expense";

export interface IExpenseRepository {
  getExpensesByDate: (date: Date) => Promise<{ expenses: ExpenseSchema[] }>;
  addExpense: (input: ExpenseInsertSchema) => Promise<ExpenseSchema>;
  getPettyCashBalance: (date: Date) => Promise<ExpenseSchema | null>;
}
