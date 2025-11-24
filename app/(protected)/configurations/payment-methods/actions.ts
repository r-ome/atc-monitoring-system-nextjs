"use server";

import { GetPaymentMethodsController } from "src/controllers/payment-methods/get-payment-methods.controller";
import { CreatePaymentMethodController } from "src/controllers/payment-methods/create-payment-method.controller";
import { UpdatePaymentMethodController } from "src/controllers/payment-methods/update-payment-method.controller";

export const getPaymentMethods = async () => {
  return await GetPaymentMethodsController();
};

export const createPaymentMethod = async (input: FormData) => {
  const data = Object.fromEntries(input.entries());
  return await CreatePaymentMethodController(data);
};

export const updatePaymentMethod = async (
  payment_method_id: string,
  input: FormData
) => {
  const data = Object.fromEntries(input.entries());

  return await UpdatePaymentMethodController(payment_method_id, data);
};
