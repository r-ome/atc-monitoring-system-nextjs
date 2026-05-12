import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import {
  InventoryRepository,
  PaymentRepository,
} from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  refundAuctionInventoriesSchema,
  RefundAuctionInventoriesInput,
} from "src/entities/models/Payment";
import { ok, err } from "src/entities/models/Result";
import { RequestContext } from "@/app/lib/prisma/RequestContext";

function buildRefundedItemsLogDescription(
  data: RefundAuctionInventoriesInput,
  items: {
    auction_inventory_id: string;
    inventory?: { barcode: string; control: string | null } | null;
    auction_bidder?: { bidder?: { bidder_number: string } | null } | null;
  }[],
) {
  return JSON.stringify({
    type: "refunded_items",
    summary: `Refunded ${data.auction_inventories.length} item(s): ${data.reason}`,
    items: data.auction_inventories.map((inputItem) => {
      const item = items.find(
        (candidate) =>
          candidate.auction_inventory_id === inputItem.auction_inventory_id,
      );

      return {
        barcode: item?.inventory?.barcode ?? "",
        control: item?.inventory?.control ?? "",
        bidder_number: item?.auction_bidder?.bidder?.bidder_number ?? "",
        price: inputItem.prev_price.toString(),
      };
    }),
  });
}

export const RefundAuctionsInventoriesController = async (
  input: Partial<RefundAuctionInventoriesInput>,
) => {
  const ctx = RequestContext.getStore();

  try {
    const auction_inventories: RefundAuctionInventoriesInput["auction_inventories"] =
      typeof input.auction_inventories === "string"
        ? JSON.parse(input.auction_inventories)
        : [];

    const formattedInput = {
      auction_bidder_id: input.auction_bidder_id,
      reason: input.reason,
      auction_inventories: auction_inventories.map((item) => ({
        auction_inventory_id: item.auction_inventory_id,
        inventory_id: item.inventory_id,
        prev_price: item.prev_price,
        new_price: item.new_price,
      })),
    };

    const { data, error: inputParseError } =
      refundAuctionInventoriesSchema.safeParse(formattedInput);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const items = await Promise.all(
      data.auction_inventories.map((item) =>
        InventoryRepository.getAuctionItemDetails(item.auction_inventory_id),
      ),
    );
    await PaymentRepository.refundAuctionInventories(data, ctx?.username);
    await logActivity(
      "UPDATE",
      "auction_inventory",
      data.auction_bidder_id,
      buildRefundedItemsLogDescription(
        data,
        items.filter((item) => item !== null),
      ),
    );
    return ok(undefined);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("RefundAuctionsInventoriesController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }

    logger("RefundAuctionsInventoriesController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
