import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { PaymentRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";

export const UndoPaymentController = async (receipt_id: string) => {
  try {
    const res = await PaymentRepository.undoPayment(receipt_id);
    await logActivity("DELETE", "payment", receipt_id, `Undid payment receipt ${receipt_id}`);
    return ok(res);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UndoPaymentController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UndoPaymentController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error?.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
