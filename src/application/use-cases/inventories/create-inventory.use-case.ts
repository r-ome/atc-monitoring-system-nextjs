import { InputParseError } from "src/entities/errors/common";
import { CreateInventoryInput } from "src/entities/models/Inventory";
import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";
import { getContainerByIdUseCase } from "../containers/get-container-by-id.use-case";

export const createInventoryUseCase = async (input: CreateInventoryInput) => {
  const container = await getContainerByIdUseCase(input.container_id);
  const match = container.inventories.find((inventory) => {
    if (input.barcode.split("-").length === 3) {
      return inventory.barcode === input.barcode;
    }

    return (
      input.barcode === inventory.barcode && input.control === inventory.control
    );
  });

  if (match) {
    const error_field =
      match.barcode.split("-").length === 2 ? "control" : "barcode";

    throw new InputParseError("Invalid Data!", {
      cause: {
        [error_field]: [
          `Barcode ${input.barcode} with Control ${input.control} already taken!`,
        ],
      },
    });
  }

  return InventoryRepository.createInventory(input);
};
