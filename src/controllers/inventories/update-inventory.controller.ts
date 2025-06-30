import { updateInventoryUseCase } from "src/application/use-cases/inventories/update-inventory.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  InventoryInsertSchema,
  InventorySchema,
  type InventoryInsertSchema as InventoryInsertSchemaType,
} from "src/entities/models/Inventory";
import { ok, err } from "src/entities/models/Response";

function presenter(
  inventory: Omit<
    InventorySchema,
    "container" | "histories" | "auctions_inventories"
  >
) {
  return { ...inventory };
}

export const UpdateInventoryController = async (
  inventory_id: string,
  input: Partial<InventoryInsertSchemaType>
) => {
  try {
    const { data, error: inputParseError } =
      InventoryInsertSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const updated = await updateInventoryUseCase(inventory_id, data);
    return ok(presenter(updated));
  } catch (error) {
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
