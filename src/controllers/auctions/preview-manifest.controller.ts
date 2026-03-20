import { getSheetData, VALID_FILE_TYPES } from "@/app/lib/sheets";
import { previewManifestUseCase } from "src/application/use-cases/auctions/preview-manifest.use-case";
import {
  InputParseError,
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { type ManifestSheetRecord } from "src/entities/models/Manifest";
import { err, ok } from "src/entities/models/Result";

export const PreviewManifestController = async (
  auction_id: string,
  file: File,
) => {
  try {
    if (!file) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Manifest File is required!"] },
      });
    }

    if (!VALID_FILE_TYPES.includes(file.type)) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["File Type does not match valid file types"] },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const { data, headers } = getSheetData(arrayBuffer, "manifest");

    if (!data.length) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Sheet that was uploaded has no records!"] },
      });
    }

    const hasInvalidHeaders = [
      "BARCODE",
      "CONTROL #",
      "DESCRIPTION",
      "BIDDER #",
      "QTY",
      "PRICE",
      "MANIFEST NUMBER",
    ]
      .map((item) => headers.includes(item))
      .some((item) => !item);

    if (hasInvalidHeaders) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Headers didn't match expected manifest"] },
      });
    }

    const processed = await previewManifestUseCase(
      auction_id,
      data as ManifestSheetRecord[],
    );

    return ok(processed);
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
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
