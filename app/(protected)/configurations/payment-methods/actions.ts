"use server";

import {
  authorizeAction,
  runWithBranchContext,
  runWithUserContext,
} from "@/app/lib/protected-action";
import {
  GetPaymentMethodsController,
  GetEnabledPaymentMethodsController,
} from "src/controllers/payment-methods/get-payment-methods.controller";
import { CreatePaymentMethodController } from "src/controllers/payment-methods/create-payment-method.controller";
import { UpdatePaymentMethodController } from "src/controllers/payment-methods/update-payment-method.controller";

export const getPaymentMethods = async () => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    GetPaymentMethodsController(),
  );
};

export const getEnabledPaymentMethods = async () => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    GetEnabledPaymentMethodsController(),
  );
};

export const createPaymentMethod = async (input: FormData) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(input.entries());
  return await runWithUserContext(auth.value, async () =>
    CreatePaymentMethodController(data),
  );
};

export const updatePaymentMethod = async (
  payment_method_id: string,
  input: FormData
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(input.entries());

  return await runWithUserContext(auth.value, async () =>
    UpdatePaymentMethodController(payment_method_id, data),
  );
};
