import { ExpensesRepository } from "src/infrastructure/repositories/expenses.repository";

export const getExpensesByDateUseCase = async (date: Date) => {
  return await ExpensesRepository.getExpensesByDate(date);
};
