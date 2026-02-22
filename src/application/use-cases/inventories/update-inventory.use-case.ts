import { InputParseError } from "src/entities/errors/common";
import { CreateInventoryInput } from "src/entities/models/Inventory";
import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";
import { getContainersUseCase } from "../containers/get-containers.use-case";
import { formatNumberPadding } from "@/app/lib/utils";
import { getInventoryUseCase } from "./get-inventory.use-case";

export const updateInventoryUseCase = async (
  inventory_id: string,
  input: CreateInventoryInput
) => {
  const containers = await getContainersUseCase();
  await getInventoryUseCase(inventory_id);

  const hasInventoryBarcode = input.barcode.split("-").length === 3;
  const item_container_barcode = hasInventoryBarcode
    ? input.barcode.split("-").slice(0, -1).join("-")
    : input.barcode;

  if (hasInventoryBarcode) {
    const formatted_inventory_barcode = formatNumberPadding(
      input.barcode.split("-")[2],
      3
    );

    input.barcode = input.barcode
      .split("-")
      .slice(0, -1)
      .concat(formatted_inventory_barcode)
      .join("-");
  }

  const container = containers.find(
    (container) => container.barcode === item_container_barcode
  );

  if (!container) {
    throw new InputParseError("Invalid Data!", {
      cause: {
        barcode: [
          `Container Barcode(${item_container_barcode}) does not exist!`,
        ],
      },
    });
  }

  const match = container.inventories.find(
    (item) =>
      item.barcode === input.barcode && item.inventory_id !== inventory_id
  );

  if (match) {
    throw new InputParseError("Invalid Data!", {
      cause: {
        barcode: [`Barcode ${input.barcode} already taken!`],
      },
    });
  }

  return InventoryRepository.updateInventory(inventory_id, input);
};
