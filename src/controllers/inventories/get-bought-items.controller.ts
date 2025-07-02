import { logger } from "@/app/lib/logger";
import { getBoughtItemsUseCase } from "src/application/use-cases/inventories/get-bought-items.use-case";
import { DatabaseOperationError } from "src/entities/errors/common";
import { InventorySchema } from "src/entities/models/Inventory";
import { err, ok } from "src/entities/models/Response";

function presenter(
  bought_items: Omit<InventorySchema, "histories" | "container">[]
) {
  return bought_items.map((item) => ({
    inventory_id: item.inventory_id,
    barcode: item.barcode,
    control: item.control || "NC",
    description: item.auctions_inventories[0].description,
    old_price: item.auctions_inventories[0].price,
    qty: item.auctions_inventories[0].qty,
    bidder_number: "ATC",
    new_price: item.is_bought_item || 0,
  }));
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
