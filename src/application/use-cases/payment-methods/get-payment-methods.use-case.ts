import { PaymentMethodRepository } from "src/infrastructure/repositories/payment-methods.repository";

export const getPaymentMethods = async () => {
  return await PaymentMethodRepository.getPaymentMethods();
};
