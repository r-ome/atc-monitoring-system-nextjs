import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { previewManifestUseCase } from "src/application/use-cases/auctions/preview-manifest.use-case";
import { AuctionRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  type ManifestSheetRecord,
  type UploadManifestInput,
} from "src/entities/models/Manifest";
import { err, ok } from "src/entities/models/Result";

const toSheetRecord = (row: UploadManifestInput): ManifestSheetRecord => ({
  BARCODE: row.BARCODE,
  CONTROL: row.CONTROL,
  DESCRIPTION: row.DESCRIPTION,
  BIDDER: row.BIDDER,
  PRICE: row.PRICE,
  QTY: row.QTY,
  MANIFEST: row.MANIFEST ?? "ADD ON",
});

function buildAddOnItemsLogDescription(
  summary: string,
  items: Array<{ BARCODE: string; CONTROL: string; PRICE: string }>,
) {
  return JSON.stringify({
    type: "add_on_items",
    summary,
    items: items.map((item) => ({
      barcode: item.BARCODE?.toString() ?? "",
      control: item.CONTROL?.toString() ?? "",
      price: item.PRICE?.toString() ?? "",
    })),
  });
}

export const ConfirmAddOnController = async (
  auction_id: string,
  data: UploadManifestInput[],
) => {
  const ctx = RequestContext.getStore();
  const user_context = { username: ctx?.username, branch_name: ctx?.branch_name };

  try {
    const processed = await previewManifestUseCase(
      auction_id,
      data.map(toSheetRecord),
    );
    const res = await AuctionRepository.uploadManifest(
      auction_id,
      processed,
      false,
      ctx?.username,
    );

    logger(
      "ConfirmAddOnController",
      { auction_id, records: res.length, ...user_context },
      "info",
    );
    await logActivity(
      "CREATE",
      "auction_inventory",
      auction_id,
      buildAddOnItemsLogDescription(
        `Confirmed add on upload: ${res.length} records`,
        processed,
      ),
    );
    return ok(`${res.length} records uploaded!`);
  } catch (error) {
    logger("ConfirmAddOnController", error, "error", user_context);

    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error.cause });
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
