import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
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
    const res = await uploadManifestUseCase(auction_id, [
      input as ManifestSheetRecord,
    ], false, ctx?.username);

    await logActivity("CREATE", "auction_inventory", auction_id, `Inserted inventory item into auction`);
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
