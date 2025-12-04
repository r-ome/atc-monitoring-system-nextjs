import { PaymentRepository } from "src/infrastructure/repositories/payments.repository";

export const undoPaymentUseCase = async (receipt_id: string) => {
  return await PaymentRepository.undoPayment(receipt_id);
};
