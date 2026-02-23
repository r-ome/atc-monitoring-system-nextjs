import { logger } from "@/app/lib/logger";
import { recalculatePettyCashUseCase } from "src/application/use-cases/expenses/recalculate-petty-cash.use-case";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { PettyCash } from "src/entities/models/Expense";
import { err, ok } from "src/entities/models/Result";

export const RecalculatePettyCashController = async (input: PettyCash) => {
  try {
    logger("RecalculatePettyCashController", input, "info");
    const res = await recalculatePettyCashUseCase(input);
    return ok(res);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("RecalculatePettyCashController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("RecalculatePettyCashController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error?.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
