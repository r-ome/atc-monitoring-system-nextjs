import { logger } from "@/app/lib/logger";
import { getInventoriesWithNoAuctionsInventoriesUseCase } from "src/application/use-cases/inventories/get-inventories-with-no-auctions-inventories.use-case";
import { DatabaseOperationError } from "src/entities/errors/common";
import { InventoryWithAuctionsInventoryRow } from "src/entities/models/Inventory";
import { err, ok } from "src/entities/models/Result";
import { formatDate } from "@/app/lib/utils";

function presenter(inventories: InventoryWithAuctionsInventoryRow[]) {
  return inventories.map((item) => ({
    inventory_id: item.inventory_id,
    barcode: item.barcode,
    control: item.control ?? "NC",
    created_at: formatDate(item.created_at, "MMM dd, yyyy"),
  }));
}

export const GetInventoriesWithNoAuctionsInventoriesController = async () => {
  try {
    const inventories = await getInventoriesWithNoAuctionsInventoriesUseCase();
    return ok(presenter(inventories));
  } catch (error) {
    logger("GetInventoriesWithNoAuctionsInventories", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
