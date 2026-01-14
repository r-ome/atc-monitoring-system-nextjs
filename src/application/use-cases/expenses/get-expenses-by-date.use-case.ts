import { ExpensesRepository } from "src/infrastructure/repositories/expenses.repository";

export const getExpensesByDateUseCase = async (
  date: Date,
  branch_id: string | undefined
) => {
  return await ExpensesRepository.getExpensesByDate(date, branch_id);
};
