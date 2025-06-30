import { PaymentRepository } from "src/infrastructure/repositories/payments.repository";

export const getPaymentsByDateUseCase = async (date: Date) => {
  return PaymentRepository.getPaymentsByDate(date);
};
