import { logger } from "@/app/lib/logger";
import { ExpensesRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { PettyCash } from "src/entities/models/Expense";
import { err, ok } from "src/entities/models/Result";

export const RecalculatePettyCashController = async (input: PettyCash) => {
  try {
    logger("RecalculatePettyCashController", input, "info");
    await ExpensesRepository.recalculatePettyCash(input);
    return ok({ message: "Petty cash recalculated" });
  } catch (error) {
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
