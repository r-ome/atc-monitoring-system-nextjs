import { PettyCash } from "src/entities/models/Expense";
import { ExpensesRepository } from "src/infrastructure/repositories/expenses.repository";

export const recalculatePettyCashUseCase = async (petty_cash: PettyCash) => {
  return await ExpensesRepository.recalculatePettyCash(petty_cash);
};
