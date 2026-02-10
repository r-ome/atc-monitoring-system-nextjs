import { logger } from "@/app/lib/logger";
import { recalculatePettyCashUseCase } from "src/application/use-cases/expenses/recalculate-petty-cash.use-case";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { PettyCash } from "src/entities/models/Expense";
import { err, ok } from "src/entities/models/Response";

export const RecalculatePettyCashController = async (input: PettyCash) => {
  try {
    console.info(`Recalculating Petty Cash for ${input.created_at}`, input);
    const res = await recalculatePettyCashUseCase(input);
    return ok(res);
  } catch (error) {
    logger("RecalculatePettyCashController", error);
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
