import { logger } from "@/app/lib/logger";
import { getBoughtItemsUseCase } from "src/application/use-cases/inventories/get-bought-items.use-case";
import { DatabaseOperationError } from "src/entities/errors/common";
import { InventorySchema } from "src/entities/models/Inventory";
import { err, ok } from "src/entities/models/Response";

function presenter(
  bought_items: Omit<InventorySchema, "histories" | "container">[],
) {
  return bought_items.map((item) => {
    return {
      inventory_id: item.inventory_id,
      barcode: item.barcode,
      control: item.control || "NC",
      description: item.auctions_inventory?.description,
      old_price: item.is_bought_item,
      qty: item.auctions_inventory?.qty ?? null,
      bidder_number: "5013",
      new_price:
        item.status === "BOUGHT_ITEM" ? 0 : item.auctions_inventory?.price,
    };
  });
}

export const GetBoughtItemsController = async () => {
  try {
    const bought_items = await getBoughtItemsUseCase();
    return ok(presenter(bought_items));
  } catch (error) {
    logger("GetBoughtItemsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
