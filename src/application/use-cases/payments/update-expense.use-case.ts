import { UpdateExpenseInputSchema } from "src/entities/models/Expense";
import { ExpensesRepository } from "src/infrastructure/repositories/expenses.repository";

export const updateExpenseUseCase = async (
  expense_id: string,
  data: UpdateExpenseInputSchema
) => {
  return ExpensesRepository.updateExpense(expense_id, data);
};
