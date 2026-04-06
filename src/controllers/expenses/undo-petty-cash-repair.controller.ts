import { ExpensesRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import type { PettyCashSnapshot } from "src/entities/models/Expense";
import { logActivity } from "@/app/lib/log-activity";

export const UndoPettyCashRepairController = async (
  snapshot: PettyCashSnapshot,
) => {
  try {
    if (!Array.isArray(snapshot) || snapshot.length === 0) {
      throw new InputParseError("Snapshot must be a non-empty array.");
    }

    await ExpensesRepository.undoRepair(snapshot);
    await logActivity(
      "UPDATE",
      "expense",
      "bulk",
      `Undid petty cash repair (${snapshot.length} snapshot records)`,
    );

    logger(
      "UndoPettyCashRepairController",
      { count: snapshot.length },
      "info",
    );

    return ok(undefined);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UndoPettyCashRepairController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UndoPettyCashRepairController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
