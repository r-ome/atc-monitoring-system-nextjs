import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { updatePaymentMethodUseCase } from "src/application/use-cases/payment-methods/update-payment-method.use-case";
import { updatePaymentMethodSchema } from "src/entities/models/PaymentMethod";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { buildActivityLogDiff } from "@/app/lib/activity-log-diff";
import { PaymentMethodRepository } from "src/infrastructure/di/repositories";
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

    const previous = await PaymentMethodRepository.getPaymentMethod(payment_method_id);
    const payment_method = await updatePaymentMethodUseCase(
      payment_method_id,
      data,
    );
    const diffDescription = previous
      ? buildActivityLogDiff({
          previous,
          current: payment_method,
          fields: [
            { label: "Name", getValue: (item) => item.name },
            { label: "State", getValue: (item) => item.state },
          ],
        })
      : "";
    const description = diffDescription
      ? `Updated payment method ${payment_method.name} | ${diffDescription}`
      : `Updated payment method ${payment_method.name}`;
    await logActivity("UPDATE", "payment_method", payment_method_id, description);
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
