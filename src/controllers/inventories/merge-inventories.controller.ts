import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { InventoryRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { mergeInventoriesSchema } from "src/entities/models/Inventory";
import { ok, err } from "src/entities/models/Result";

export const MergeInventoriesController = async (
  input: Record<string, unknown>,
) => {
  try {
    const { data, error: inputParseError } =
      mergeInventoriesSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const mergeResult = await InventoryRepository.mergeInventories(data);
    const description = JSON.stringify({
      type: "merged_inventories",
      summary: `Merged inventories into container ${mergeResult.merged_into_barcode}`,
      items: mergeResult.items,
    });

    await logActivity(
      "UPDATE",
      "inventory",
      data.new_inventory_id,
      description,
    );
    return ok({});
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("MergeInventoriesController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("MergeInventoriesController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("MergeInventoriesController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
