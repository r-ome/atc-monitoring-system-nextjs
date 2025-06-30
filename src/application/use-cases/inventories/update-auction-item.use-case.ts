import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";
import { AuctionInventoryUpdateSchema } from "src/entities/models/Inventory";
import { getContainersUseCase } from "../containers/get-containers.use-case";
import { InputParseError } from "src/entities/errors/common";
import { formatNumberPadding } from "@/app/lib/utils";

export const updateAuctionItemUseCase = async (
  data: AuctionInventoryUpdateSchema
) => {
  const containers = await getContainersUseCase();
  const has_inventory_barcode = data.barcode.split("-").length === 3;
  let item_container_barcode = has_inventory_barcode
    ? data.barcode.split("-").slice(0, -1).join("-")
    : data.barcode;

  if (has_inventory_barcode) {
    const formatted_inventory_barcode = formatNumberPadding(
      data.barcode.split("-")[2],
      3
    );

    data.barcode = data.barcode
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
      item.barcode === data.barcode && item.inventory_id !== data.inventory_id
  );

  if (match) {
    throw new InputParseError("Invalid Data!", {
      cause: {
        barcode: [`Barcode ${data.barcode} already taken!`],
      },
    });
  }

  return await InventoryRepository.updateAuctionItem(data);
};
