import { logger } from "@/app/lib/logger";
import { appendInventoriesUseCase } from "src/application/use-cases/inventories/append-inventories.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";

export const AppendInventoriesController = async (
  container_barcode: string,
  inventory_ids: string[],
) => {
  try {
    await appendInventoriesUseCase(container_barcode, inventory_ids);
    return ok({});
  } catch (error) {
    logger("AppendInventoriesController", error);
    if (error instanceof InputParseError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
