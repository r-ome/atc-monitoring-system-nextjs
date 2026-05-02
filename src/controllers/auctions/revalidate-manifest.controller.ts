import { revalidateManifestUseCase } from "src/application/use-cases/auctions/revalidate-manifest.use-case";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { type UploadManifestInput } from "src/entities/models/Manifest";
import { err, ok } from "src/entities/models/Result";

export const RevalidateManifestController = async (
  auction_id: string,
  data: UploadManifestInput[],
) => {
  try {
    const processed = await revalidateManifestUseCase(auction_id, data);
    return ok(processed);
  } catch (error) {
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
