import { ExpensesRepository } from "src/infrastructure/repositories/expenses.repository";

export const getPettyCashBalanceUseCase = async (date: Date) => {
  return await ExpensesRepository.getPettyCashBalance(date);
};
