import {
  ExpenseSchema,
  ExpenseInsertSchema,
} from "src/entities/models/Expense";

export interface IExpenseRepository {
  getExpensesByDate: (
    date: Date
  ) => Promise<{ expenses: ExpenseSchema[]; yesterday_balance: number }>;
  addExpense: (input: ExpenseInsertSchema) => Promise<ExpenseSchema>;
}
