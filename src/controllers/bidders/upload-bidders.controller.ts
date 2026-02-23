import { logger } from "@/app/lib/logger";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { getSheetData, VALID_FILE_TYPES } from "@/app/lib/sheets";
import { uploadBiddersUseCase } from "src/application/use-cases/bidders/upload-bidders.use-case";
import {
  InputParseError,
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { BidderSheetRecord } from "src/entities/models/Bidder";
import { err, ok } from "src/entities/models/Result";

export const UploadBiddersController = async (
  branch_id: string,
  file: File,
) => {
  const ctx = RequestContext.getStore();
  const user_context = {
    username: ctx?.username,
    branch_name: ctx?.branch_name,
  };

  try {
    if (!file) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Bidders File is required!"] },
      });
    }

    if (!VALID_FILE_TYPES.includes(file.type)) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["File Type does not match valid file types"] },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const { data, headers } = getSheetData(arrayBuffer, "bidders");

    if (!data.length) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Sheet that was uploaded has no records!"] },
      });
    }

    const validBiddersHeader = [
      "NEW_NUMBER",
      "FIRST_NAME",
      "MIDDLE_NAME",
      "LAST_NAME",
      "%",
      "REG_FEE",
      "CELLPHONE_NUMBER",
      "BIRTH_DATE",
      "ADDRESS",
      "TIN_NUMBER",
    ]
      .map((item) => headers.includes(item))
      .some((item) => !item);

    if (validBiddersHeader) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Headers didn't match expected manifest"] },
      });
    }

    const res = await uploadBiddersUseCase(
      branch_id,
      data as BidderSheetRecord[],
    );

    logger("StartAuctionController", { ...user_context }, "info");
    return ok(`${res.count} records uploaded!`);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UploadBiddersController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UploadBiddersController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UploadBiddersController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
