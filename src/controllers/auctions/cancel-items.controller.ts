import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import {
  AuctionRepository,
  InventoryRepository,
} from "src/infrastructure/di/repositories";
import { cancelItemsSchema, CancelItemsInput } from "src/entities/models/Inventory";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";

function buildCancelledItemsLogDescription(
  data: CancelItemsInput,
  items: {
    inventory?: { barcode: string; control: string | null } | null;
    auction_bidder?: { bidder?: { bidder_number: string } | null } | null;
    price: number;
  }[],
  bidder: { bidder_number: string; first_name: string; last_name: string },
) {
  return JSON.stringify({
    type: "cancelled_items",
    summary: `Cancelled ${data.auction_inventory_ids.length} item(s) from bidder #${bidder.bidder_number} (${bidder.first_name} ${bidder.last_name}): ${data.reason}`,
    items: items.map((item) => ({
      barcode: item.inventory?.barcode ?? "",
      control: item.inventory?.control ?? "",
      bidder_number: item.auction_bidder?.bidder?.bidder_number ?? "",
      price: item.price.toString(),
    })),
  });
}

export const CancelItemsController = async (
  input: Partial<CancelItemsInput>,
) => {
  const ctx = RequestContext.getStore();

  try {
    const { data, error: inputParseError } = cancelItemsSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const items = await Promise.all(
      data.auction_inventory_ids.map((auctionInventoryId) =>
        InventoryRepository.getAuctionItemDetails(auctionInventoryId),
      ),
    );
    const res = await AuctionRepository.cancelItems(data, ctx?.username);
    await logActivity(
      "UPDATE",
      "auction_inventory",
      data.auction_bidder_id,
      buildCancelledItemsLogDescription(
        data,
        items.filter((item) => item !== null),
        res,
      ),
    );
    return ok(res);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("CancelItemsController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }

    if (error instanceof NotFoundError) {
      logger("CancelItemsController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }

    logger("CancelItemsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
