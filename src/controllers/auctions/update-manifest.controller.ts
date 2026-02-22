import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { updateManifestUseCase } from "src/application/use-cases/auctions/update-manifest.use-case";
import { logger } from "@/app/lib/logger";
import {
  updateManifestSchema,
  UpdateManifestInput,
  ManifestRow,
} from "src/entities/models/Manifest";

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

    const updated = await updateManifestUseCase(auction_id, manifest_id, data);
    return ok(presenter(updated));
  } catch (error) {
    logger("UpdateManifestController", error);
    if (error instanceof InputParseError) {
      return err({ message: error.message, cause: error.cause });
    }

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
