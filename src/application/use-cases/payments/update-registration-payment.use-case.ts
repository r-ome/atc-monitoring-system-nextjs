import { UpdateRegistrationPaymentInput } from "src/entities/models/Payment";
import { PaymentRepository } from "src/infrastructure/repositories/payments.repository";

export const updateRegistrationPaymentUseCase = async (
  payment_id: string,
  data: UpdateRegistrationPaymentInput
) => {
  return PaymentRepository.updateRegistrationPayment(payment_id, data);
};
