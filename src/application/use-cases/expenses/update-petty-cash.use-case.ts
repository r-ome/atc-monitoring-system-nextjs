import { PettyCashInsertSchemaType } from "src/entities/models/Expense";
import { ExpensesRepository } from "src/infrastructure/repositories/expenses.repository";

export const updatePettyCashUseCase = async (
  petty_cash_id: string,
  input: PettyCashInsertSchemaType
) => {
  return await ExpensesRepository.updatePettyCash(petty_cash_id, input);
};
