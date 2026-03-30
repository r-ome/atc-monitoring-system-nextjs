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
import { formatDate } from "@/app/lib/utils";
import { AuctionRepository } from "src/infrastructure/di/repositories";
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

    await updateAuctionItemUseCase(data, ctx?.username);

    const auction = await AuctionRepository.getAuctionById(data.auction_id);
    const auctionDate = auction ? formatDate(auction.created_at, "MMM dd, yyyy") : data.auction_id;
    await logActivity(
      "UPDATE",
      "auction_inventory",
      `${data.barcode}-${data.control}`,
      `Updated auction item barcode: ${data.barcode}, control: ${data.control} on ${auctionDate}`,
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
