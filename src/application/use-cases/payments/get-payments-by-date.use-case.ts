import { PaymentRepository } from "src/infrastructure/repositories/payments.repository";

export const getPaymentsByDateUseCase = async (
  date: Date,
  branch_id: string | undefined
) => {
  return PaymentRepository.getPaymentsByDate(date, branch_id);
};
