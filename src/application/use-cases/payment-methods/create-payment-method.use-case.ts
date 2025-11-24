import { PaymentMethodInsertSchema } from "src/entities/models/PaymentMethod";
import { PaymentMethodRepository } from "src/infrastructure/repositories/payment-methods.repository";
import { InputParseError } from "src/entities/errors/common";

export const createPaymentMethodUseCase = async (
  method: PaymentMethodInsertSchema
) => {
  const payment_methods = await PaymentMethodRepository.getPaymentMethods();
  const exists = payment_methods.find((item) => item.name === method.name);

  if (exists) {
    throw new InputParseError("Invalid Data!", {
      cause: { name: ["Name already exists!"] },
    });
  }

  return await PaymentMethodRepository.createPaymentMethod(method);
};
