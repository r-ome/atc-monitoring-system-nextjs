import { ExpenseInsertSchema } from "src/entities/models/Expense";
import { ExpensesRepository } from "src/infrastructure/repositories/expenses.repository";

export const addExpenseUseCase = async (
  petty_cash_id: string,
  input: ExpenseInsertSchema
) => {
  return await ExpensesRepository.addExpense(petty_cash_id, input);
};
