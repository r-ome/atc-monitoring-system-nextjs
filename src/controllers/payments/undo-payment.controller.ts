import { logger } from "@/app/lib/logger";
import { undoPaymentUseCase } from "src/application/use-cases/payments/undo-payment.use-case";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Response";

export const UndoPaymentController = async (receipt_id: string) => {
  try {
    const res = await undoPaymentUseCase(receipt_id);
    return ok(res);
  } catch (error) {
    logger("HandleBidderPullOutController", error);
    if (error instanceof InputParseError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error?.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
