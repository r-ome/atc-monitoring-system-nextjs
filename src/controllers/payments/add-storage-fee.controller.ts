import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { PaymentRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import {
  storageFeePaymentSchema,
  StorageFeePaymentInput,
} from "src/entities/models/Payment";

export const AddStorageFeeController = async (
  input: Partial<StorageFeePaymentInput>,
) => {
  const parsed = storageFeePaymentSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      message: "Validation Error",
      cause: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    await PaymentRepository.addStorageFee(parsed.data);
    await logActivity("CREATE", "payment", parsed.data.parent_receipt_id, `Added storage fee ₱${parsed.data.amount.toLocaleString()}`);
    return ok(undefined);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("AddStorageFeeController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("AddStorageFeeController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error?.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
