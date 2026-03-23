import { logger } from "@/app/lib/logger";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { AuctionRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { type UploadManifestInput } from "src/entities/models/Manifest";
import { err, ok } from "src/entities/models/Result";

export const ConfirmUploadManifestController = async (
  auction_id: string,
  data: UploadManifestInput[],
) => {
  const ctx = RequestContext.getStore();
  const user_context = { username: ctx?.username, branch_name: ctx?.branch_name };

  try {
    const res = await AuctionRepository.uploadManifest(auction_id, data, false, ctx?.username);

    logger("ConfirmUploadManifestController", { auction_id, records: res.length, ...user_context }, "info");
    return ok(`${res.length} records uploaded!`);
  } catch (error) {
    logger("ConfirmUploadManifestController", error, "error", user_context);

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
