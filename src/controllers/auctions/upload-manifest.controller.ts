import { logger } from "@/app/lib/logger";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { getSheetData, VALID_FILE_TYPES } from "@/app/lib/sheets";
import { uploadManifestUseCase } from "src/application/use-cases/auctions/upload-manifest.use-case";
import {
  InputParseError,
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { type ManifestSheetRecord } from "src/entities/models/Manifest";
import { err, ok } from "src/entities/models/Result";

export const UploadManifestController = async (
  auction_id: string,
  file: File,
) => {
  const ctx = RequestContext.getStore();
  const user_context = { username: ctx?.username, branch_name: ctx?.branch_name };

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

    const validManifestHeaders = [
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

    if (validManifestHeaders) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Headers didn't match expected manifest"] },
      });
    }

    const res = await uploadManifestUseCase(
      auction_id,
      data as ManifestSheetRecord[],
    );

    logger("UploadManifestController", { auction_id, records: res.length, ...user_context }, "info");
    return ok(`${res.length} records uploaded!`);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UploadManifestController", error, "warn", user_context);
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UploadManifestController", error, "warn", user_context);
      return err({ message: error.message, cause: error.cause });
    }

    logger("UploadManifestController", error, "error", user_context);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
