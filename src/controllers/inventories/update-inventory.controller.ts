import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { buildActivityLogDiff } from "@/app/lib/activity-log-diff";
import { updateInventoryUseCase } from "src/application/use-cases/inventories/update-inventory.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  createInventorySchema,
  CreateInventoryInput,
  InventoryRow,
} from "src/entities/models/Inventory";
import { ok, err } from "src/entities/models/Result";
import { InventoryRepository } from "src/infrastructure/di/repositories";

function presenter(inventory: InventoryRow) {
  return inventory;
}

export const UpdateInventoryController = async (
  inventory_id: string,
  input: Partial<CreateInventoryInput>,
) => {
  try {
    const { data, error: inputParseError } =
      createInventorySchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const previous = await InventoryRepository.getInventory(inventory_id);
    const updated = await updateInventoryUseCase(inventory_id, data);
    const diffDescription = buildActivityLogDiff({
      previous,
      current: updated,
      fields: [
        { label: "Barcode", getValue: (item) => item.barcode },
        { label: "Control", getValue: (item) => item.control },
        { label: "Description", getValue: (item) => item.description },
      ],
    });
    const description = diffDescription
      ? `Updated inventory ${updated.barcode} | ${diffDescription}`
      : `Updated inventory ${updated.barcode}`;
    await logActivity("UPDATE", "inventory", inventory_id, description);
    return ok(presenter(updated));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateInventoryController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UpdateInventoryController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateInventoryController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
