import { logger } from "@/app/lib/logger";
import { deleteInventoryUseCase } from "src/application/use-cases/inventories/delete-inventory.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";

export const DeleteInventoryController = async (inventory_id: string) => {
  try {
    await deleteInventoryUseCase(inventory_id);
    return ok({});
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("DeleteInventoryController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("DeleteInventoryController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("DeleteInventoryController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
