import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { AuctionRepository } from "src/infrastructure/di/repositories";

export const DeleteFailedManifestRecordController = async (
  auction_id: string,
  manifest_id: string,
) => {
  const ctx = RequestContext.getStore();
  const user_context = {
    username: ctx?.username,
    branch_name: ctx?.branch_name,
  };

  try {
    const deleted = await AuctionRepository.deleteFailedManifestRecord(
      auction_id,
      manifest_id,
    );
    const barcode = deleted.barcode ?? "No barcode";
    const control = deleted.control ?? "No control";

    logger(
      "DeleteFailedManifestRecordController",
      { auction_id, manifest_id, ...user_context },
      "info",
    );
    await logActivity(
      "DELETE",
      "manifest",
      manifest_id,
      `Deleted failed manifest record ${barcode} / ${control}`,
    );

    return ok({ message: "Failed manifest record deleted" });
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger("DeleteFailedManifestRecordController", error, "warn");
      return err({
        message: error.message,
        cause: "Only manifest records with errors can be deleted.",
      });
    }

    logger("DeleteFailedManifestRecordController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
