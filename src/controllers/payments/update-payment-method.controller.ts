import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { PaymentRepository } from "src/infrastructure/di/repositories";
import { buildActivityLogDiff } from "@/app/lib/activity-log-diff";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { updatePaymentMethodSchema } from "src/entities/models/Payment";
import { err, ok } from "src/entities/models/Result";

export const UpdatePaymentMethodController = async (
  payment_id: string,
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

    const previous = await PaymentRepository.getPaymentById(payment_id);
    await PaymentRepository.updatePaymentMethod(payment_id, data);
    const updated = await PaymentRepository.getPaymentById(payment_id);
    const diffDescription =
      previous && updated
        ? buildActivityLogDiff({
            previous,
            current: updated,
            fields: [
              {
                label: "Payment Method",
                getValue: (payment) => payment.payment_method?.name,
              },
            ],
          })
        : "";
    const paymentMethodName =
      updated?.payment_method?.name ?? previous?.payment_method?.name ?? "N/A";
    const description = diffDescription
      ? `Updated payment method ${paymentMethodName} | ${diffDescription}`
      : `Updated payment method ${paymentMethodName}`;
    await logActivity("UPDATE", "payment", payment_id, description);
    return ok(undefined);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdatePaymentMethodController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdatePaymentMethodController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error?.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
