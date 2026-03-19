import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { createPaymentMethodUseCase } from "src/application/use-cases/payment-methods/create-payment-method.use-case";
import {
  createPaymentMethodSchema,
  PaymentMethodRow,
} from "src/entities/models/PaymentMethod";
import { formatDate } from "@/app/lib/utils";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

const DATE_FORMAT = "MMM dd, yyyy hh:mm a";

export const presentPaymentMethod = (payment_method: PaymentMethodRow) => ({
  ...payment_method,
  created_at: formatDate(payment_method.created_at, DATE_FORMAT),
  updated_at: formatDate(payment_method.updated_at, DATE_FORMAT),
  deleted_at: payment_method.deleted_at
    ? formatDate(payment_method.deleted_at, DATE_FORMAT)
    : null,
});

export const CreatePaymentMethodController = async (
  input: Record<string, unknown>,
) => {
  try {
    const { data, error: inputParseError } =
      createPaymentMethodSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const payment_method = await createPaymentMethodUseCase(data);
    return ok(presentPaymentMethod(payment_method));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("CreatePaymentMethodController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("CreatePaymentMethodController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
