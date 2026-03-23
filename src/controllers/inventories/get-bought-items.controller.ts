import { logger } from "@/app/lib/logger";
import { InventoryRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { InventoryWithAuctionsInventoryRow } from "src/entities/models/Inventory";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import { err, ok } from "src/entities/models/Result";

function presenter(bought_items: InventoryWithAuctionsInventoryRow[]) {
  return bought_items.map((item) => {
    return {
      inventory_id: item.inventory_id,
      barcode: item.barcode,
      control: item.control || "NC",
      description: item.auctions_inventory?.description,
      old_price: item.is_bought_item,
      qty: item.auctions_inventory?.qty ?? null,
      bidder_number: ATC_DEFAULT_BIDDER_NUMBER,
      new_price:
        item.status === "BOUGHT_ITEM" ? 0 : item.auctions_inventory?.price,
    };
  });
}

export const GetBoughtItemsController = async (params: { year: string; month: string; branchId: string }) => {
  try {
    const bought_items = await InventoryRepository.getBoughtItems(params);
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
