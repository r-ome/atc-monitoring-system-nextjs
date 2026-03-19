import { logger } from "@/app/lib/logger";
import { PaymentRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";

export const UndoPaymentController = async (receipt_id: string) => {
  try {
    const res = await PaymentRepository.undoPayment(receipt_id);
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
