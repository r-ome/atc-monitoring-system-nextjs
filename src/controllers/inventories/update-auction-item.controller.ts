import {
  updateAuctionInventorySchema,
  UpdateAuctionInventoryInput,
} from "src/entities/models/Inventory";
import { updateAuctionItemUseCase } from "src/application/use-cases/inventories/update-auction-item.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { buildActivityLogDiff } from "@/app/lib/activity-log-diff";
import { AuctionRepository, InventoryRepository } from "src/infrastructure/di/repositories";
import { formatDate, formatNumberToCurrency } from "@/app/lib/utils";
import { RequestContext } from "@/app/lib/prisma/RequestContext";

export const UpdateAuctionItemController = async (
  input: Partial<UpdateAuctionInventoryInput>,
) => {
  const ctx = RequestContext.getStore();

  try {
    const { data, error: inputParseError } =
      updateAuctionInventorySchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const previous = await InventoryRepository.getAuctionItemDetails(
      data.auction_inventory_id,
    );
    await updateAuctionItemUseCase(data, ctx?.username);
    const updated = await InventoryRepository.getAuctionItemDetails(
      data.auction_inventory_id,
    );

    const auction = await AuctionRepository.getAuctionById(data.auction_id);
    const auctionDate = auction ? formatDate(auction.created_at, "MMM dd, yyyy") : data.auction_id;
    const diffDescription =
      previous && updated
        ? buildActivityLogDiff({
            previous,
            current: updated,
            fields: [
              {
                label: "Bidder Number",
                getValue: (item) => item.auction_bidder.bidder.bidder_number,
                formatValue: (value) => `#${value}`,
              },
              {
                label: "Barcode",
                getValue: (item) => item.inventory.barcode,
              },
              {
                label: "Control",
                getValue: (item) => item.inventory.control,
              },
              {
                label: "Description",
                getValue: (item) => item.description,
              },
              {
                label: "Price",
                getValue: (item) => item.price,
                formatValue: (value) => formatNumberToCurrency(Number(value)),
              },
              {
                label: "Qty",
                getValue: (item) => item.qty,
              },
              {
                label: "Manifest Number",
                getValue: (item) => item.manifest_number,
              },
              {
                label: "Status",
                getValue: (item) => item.status,
              },
              {
                label: "Container",
                getValue: (item) => item.inventory.container.barcode,
              },
            ],
          })
        : "";
    const description = diffDescription
      ? `Updated auction item barcode: ${updated?.inventory.barcode ?? data.barcode}, control: ${updated?.inventory.control ?? data.control} on ${auctionDate} | ${diffDescription}`
      : `Updated auction item barcode: ${data.barcode}, control: ${data.control} on ${auctionDate}`;
    await logActivity(
      "UPDATE",
      "auction_inventory",
      `${data.barcode}-${data.control}`,
      description,
    );
    return ok(undefined);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateAuctionItemController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UpdateAuctionItemController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }

    logger("UpdateAuctionItemController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
