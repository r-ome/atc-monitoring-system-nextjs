import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { updatePaymentMethodUseCase } from "src/application/use-cases/payment-methods/update-payment-method.use-case";
import {
  PaymentMethodInsertSchema,
  type PaymentMethodsSchema,
} from "src/entities/models/PaymentMethod";
import { formatDate } from "@/app/lib/utils";
import { err, ok } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";

const presenter = (payment_method: PaymentMethodsSchema) => {
  const date_format = "MMM dd, yyyy";
  return {
    ...payment_method,
    created_at: formatDate(payment_method.created_at, date_format),
    updated_at: formatDate(payment_method.updated_at, date_format),
    deleted_at: payment_method.deleted_at
      ? formatDate(payment_method.deleted_at, date_format)
      : null,
  };
};

export const UpdatePaymentMethodController = async (
  payment_method_id: string,
  input: Partial<PaymentMethodInsertSchema>
) => {
  try {
    const { data, error: inputParseError } =
      PaymentMethodInsertSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const payment_method = await updatePaymentMethodUseCase(
      payment_method_id,
      data
    );
    return ok(presenter(payment_method));
  } catch (error) {
    logger("UpdatePaymentMethodController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    if (error instanceof InputParseError) {
      return err({ message: error.message, cause: error.cause });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
