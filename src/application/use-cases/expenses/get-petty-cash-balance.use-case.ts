import { ExpensesRepository } from "src/infrastructure/repositories/expenses.repository";

export const getPettyCashBalanceUseCase = async (
  date: Date,
  branch_id: string
) => {
  return await ExpensesRepository.getPettyCashBalance(date, branch_id);
};
