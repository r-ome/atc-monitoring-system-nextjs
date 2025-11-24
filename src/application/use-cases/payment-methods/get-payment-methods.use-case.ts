import { PaymentMethodRepository } from "src/infrastructure/repositories/payment-methods.repository";

export const getPaymentMethodsUseCase = async () => {
  return await PaymentMethodRepository.getPaymentMethods();
};
