import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { updateManifestUseCase } from "src/application/use-cases/auctions/update-manifest.use-case";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { buildActivityLogDiff } from "@/app/lib/activity-log-diff";
import {
  updateManifestSchema,
  UpdateManifestInput,
  ManifestRow,
} from "src/entities/models/Manifest";
import { AuctionRepository } from "src/infrastructure/di/repositories";

function presenter(manifest: ManifestRow) {
  return {
    manifest_id: manifest.manifest_id,
    barcode: manifest.barcode,
    control: manifest.control,
    description: manifest.description,
    bidder_number: manifest.bidder_number,
    price: manifest.price,
    manifest_number: manifest.manifest_number,
  };
}

export const UpdateManifestController = async (
  auction_id: string,
  manifest_id: string,
  input: Partial<UpdateManifestInput>,
) => {
  try {
    const { data, error: inputParseError } =
      updateManifestSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const previous = await AuctionRepository.getManifestRecord(manifest_id);
    const updated = await updateManifestUseCase(auction_id, manifest_id, data);
    const diffDescription = previous
      ? buildActivityLogDiff({
          previous,
          current: updated,
          fields: [
            { label: "Barcode", getValue: (item) => item.barcode },
            { label: "Control", getValue: (item) => item.control },
            { label: "Description", getValue: (item) => item.description },
            { label: "Bidder Number", getValue: (item) => item.bidder_number },
            { label: "Price", getValue: (item) => item.price },
            { label: "Qty", getValue: (item) => item.qty },
            {
              label: "Manifest Number",
              getValue: (item) => item.manifest_number,
            },
          ],
        })
      : "";
    const description = diffDescription
      ? `Updated manifest record barcode: ${updated.barcode}, control: ${updated.control} | ${diffDescription}`
      : `Updated manifest record barcode: ${updated.barcode}, control: ${updated.control}`;
    await logActivity("UPDATE", "manifest", `${updated.barcode}-${updated.control}`, description);
    return ok(presenter(updated));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateManifestController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UpdateManifestController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateManifestController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
