import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { getInventoryUseCase } from "src/application/use-cases/inventories/get-inventory.use-case";
import { err, ok } from "src/entities/models/Response";
import { InventorySchema } from "src/entities/models/Inventory";
import { format } from "date-fns";
import { logger } from "@/app/lib/logger";

function presenter(inventory: InventorySchema) {
  const date_format = "MMMM dd, yyyy";
  return {
    inventory_id: inventory.inventory_id,
    barcode: inventory.barcode,
    control: inventory.control ?? "NC",
    description: inventory.description,
    status: inventory.status,
    is_bought_item: inventory.is_bought_item ?? 0,
    url: inventory.url,
    created_at: format(inventory.created_at, date_format),
    updated_at: format(inventory.updated_at, date_format),
    deleted_at: inventory.deleted_at
      ? format(inventory.deleted_at, date_format)
      : null,
    container: {
      container_id: inventory.container_id,
      barcode: inventory.container.barcode,
    },
    histories: inventory.histories.map((history) => ({
      inventory_history_id: history.inventory_history_id,
      auction_inventory_id: history.auction_inventory_id,
      inventory_id: history.inventory_id,
      receipt_id: history.receipt_id || null,
      auction_status: history.auction_status,
      inventory_status: history.inventory_status,
      remarks: history.remarks,
      created_at: format(history.created_at, date_format),
    })),
    auctions_inventories: inventory.auctions_inventories.map((item) => ({
      auction_inventory_id: item.auction_inventory_id,
      auction_bidder_id: item.auction_bidder_id,
      description: item.description,
      price: item.price,
      qty: item.qty,
      status: item.status,
      manifest_number: item.manifest_number,
      created_at: format(item.created_at, date_format),
    })),
  };
}
export const GetInventoryController = async (inventory_id: string) => {
  try {
    const inventory = await getInventoryUseCase(inventory_id);
    return ok(presenter(inventory));
  } catch (error) {
    logger("GetInventoryController", error);
    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error.message });
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
