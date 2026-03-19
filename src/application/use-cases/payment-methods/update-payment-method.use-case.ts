import { UpdatePaymentMethodInput } from "src/entities/models/PaymentMethod";
import { PaymentMethodRepository } from "src/infrastructure/di/repositories";
import { InputParseError } from "src/entities/errors/common";

export const updatePaymentMethodUseCase = async (
  payment_method_id: string,
  method: UpdatePaymentMethodInput
) => {
  const payment_methods = await PaymentMethodRepository.getPaymentMethods();
  const exists = payment_methods.find((item) => item.name === method.name);

  if (exists) {
    if (exists.payment_method_id !== payment_method_id)
      throw new InputParseError("Invalid Data!", {
        cause: { name: ["Name already exists!"] },
      });
  }

  return await PaymentMethodRepository.updatePaymentMethod(
    payment_method_id,
    method
  );
};
