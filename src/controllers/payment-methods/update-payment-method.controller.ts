import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { updatePaymentMethodUseCase } from "src/application/use-cases/payment-methods/update-payment-method.use-case";
import { updatePaymentMethodSchema } from "src/entities/models/PaymentMethod";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { presentPaymentMethod } from "./create-payment-method.controller";

export const UpdatePaymentMethodController = async (
  payment_method_id: string,
  input: Record<string, unknown>,
) => {
  try {
    const { data, error: inputParseError } =
      updatePaymentMethodSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const payment_method = await updatePaymentMethodUseCase(
      payment_method_id,
      data,
    );
    return ok(presentPaymentMethod(payment_method));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdatePaymentMethodController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdatePaymentMethodController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
