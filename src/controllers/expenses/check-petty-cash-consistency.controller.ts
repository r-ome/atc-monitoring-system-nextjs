import { ExpensesRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const CheckPettyCashConsistencyController = async (
  branch_id: string,
  startDate: string,
  endDate: string,
) => {
  try {
    if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
      throw new InputParseError("Invalid date format. Expected yyyy-MM-dd.");
    }

    if (startDate > endDate) {
      throw new InputParseError("Start date must not be after end date.");
    }

    const issues = await ExpensesRepository.checkConsistency(
      branch_id,
      startDate,
      endDate,
    );
    return ok(issues);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("CheckPettyCashConsistencyController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("CheckPettyCashConsistencyController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
