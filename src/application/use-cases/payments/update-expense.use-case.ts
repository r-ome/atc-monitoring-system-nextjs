import { UpdateExpenseInputSchema } from "src/entities/models/Payment";
import { PaymentRepository } from "src/infrastructure/repositories/payments.repository";

export const updateExpenseUseCase = async (
  expense_id: string,
  data: UpdateExpenseInputSchema
) => {
  return PaymentRepository.updateExpense(expense_id, data);
};
