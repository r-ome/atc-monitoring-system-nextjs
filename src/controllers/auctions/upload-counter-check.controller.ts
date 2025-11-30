import { logger } from "@/app/lib/logger";
import { getSheetData, VALID_FILE_TYPES } from "@/app/lib/sheets";
import { uploadCounterCheckUseCase } from "src/application/use-cases/auctions/upload-counter-check.use-case";
import {
  InputParseError,
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { CounterCheckRecord } from "src/entities/models/CounterCheck";
import { err, ok } from "src/entities/models/Response";

export const UploadCounterCheckController = async (
  auction_id: string,
  file: File
) => {
  try {
    if (!file) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Counter Check File is required!"] },
      });
    }

    if (!VALID_FILE_TYPES.includes(file.type)) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["File Type does not match valid file types"] },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const { data, headers } = getSheetData(arrayBuffer, "counter_check");

    if (!data.length) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Sheet that was uploaded has no records!"] },
      });
    }

    const validManifestHeaders = ["PAGE#", "CONTROL", "BIDDER", "TOTAL SALES"]
      .map((item) => headers.includes(item))
      .some((item) => !item);

    if (validManifestHeaders) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Headers didn't match expected manifest"] },
      });
    }

    const res = await uploadCounterCheckUseCase(
      auction_id,
      data as CounterCheckRecord[]
    );

    // return ok(`${res.count} records uploaded!`);
    return ok(`0 records uploaded!`);
  } catch (error) {
    logger("UploadCounterCheckController", error);
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
