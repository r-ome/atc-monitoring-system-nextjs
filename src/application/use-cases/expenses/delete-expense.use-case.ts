import { ExpensesRepository } from "src/infrastructure/repositories/expenses.repository";

export const deleteExpenseUseCase = async (expense_id: string) => {
  return await ExpensesRepository.deleteExpense(expense_id);
};
