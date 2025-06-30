import { ExpenseInsertSchema } from "src/entities/models/Expense";
import { ExpensesRepository } from "src/infrastructure/repositories/expenses.repository";

export const addExpenseUseCase = async (input: ExpenseInsertSchema) => {
  return await ExpensesRepository.addExpense(input);
};
