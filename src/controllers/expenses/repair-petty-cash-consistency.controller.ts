import { ExpensesRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { RequestContext } from "@/app/lib/prisma/RequestContext";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const RepairPettyCashConsistencyController = async (
  branch_id: string,
  startDate: string,
  endDate: string,
) => {
  const ctx = RequestContext.getStore();
  const user_context = {
    username: ctx?.username,
    branch_name: ctx?.branch_name,
  };

  try {
    if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
      throw new InputParseError("Invalid date format. Expected yyyy-MM-dd.");
    }

    if (startDate > endDate) {
      throw new InputParseError("Start date must not be after end date.");
    }

    const result = await ExpensesRepository.repairConsistency(
      branch_id,
      startDate,
      endDate,
    );

    logger(
      "RepairPettyCashConsistencyController",
      { branch_id, startDate, endDate, result, ...user_context },
      "info",
    );

    return ok(result);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("RepairPettyCashConsistencyController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("RepairPettyCashConsistencyController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
