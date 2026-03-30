import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { formatDate } from "@/app/lib/utils";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { AuctionRepository } from "src/infrastructure/di/repositories";
import { uploadManifestUseCase } from "src/application/use-cases/auctions/upload-manifest.use-case";
import { DatabaseOperationError } from "src/entities/errors/common";
import { ManifestSheetRecord } from "src/entities/models/Manifest";
import { err, ok } from "src/entities/models/Result";

export const InsertAuctionInventoryController = async (
  auction_id: string,
  input: Partial<ManifestSheetRecord>,
) => {
  const ctx = RequestContext.getStore();

  try {
    const [res, auction] = await Promise.all([
      uploadManifestUseCase(auction_id, [input as ManifestSheetRecord], false, ctx?.username),
      AuctionRepository.getAuctionById(auction_id),
    ]);

    const auctionDate = auction ? formatDate(auction.created_at, "MMM dd, yyyy") : auction_id;
    await logActivity(
      "CREATE",
      "auction_inventory",
      `${input.BARCODE}-${input.CONTROL}`,
      `Inserted inventory item into auction on ${auctionDate}: barcode: ${input.BARCODE}, control: ${input.CONTROL}`,
    );
    return ok(`${res.length} records uploaded!`);
  } catch (error) {
    logger("InsertAuctionInventoryController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
