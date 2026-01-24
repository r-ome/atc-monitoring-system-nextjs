import { logger } from "@/app/lib/logger";
import { getSheetData, VALID_FILE_TYPES } from "@/app/lib/sheets";
import { uploadInventoryFileUseCase } from "src/application/use-cases/containers/upload-inventory-file.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { type InventorySheetRecord } from "src/entities/models/Inventory";
import { err, ok } from "src/entities/models/Response";

export const UploadInventoryFileController = async (
  barcode: string,
  file: File,
) => {
  try {
    if (!file) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["File is required!"] },
      });
    }

    if (!VALID_FILE_TYPES.includes(file.type)) {
      throw new InputParseError("Invalid Data!", {
        cause: {
          file: [
            "Invalid file type! File Type does not match valid file types",
          ],
        },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const { data, headers } = getSheetData(arrayBuffer);

    if (!data.length) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Sheet that was uploaded has no records."] },
      });
    }

    const validInventoryHeaders = ["Barcode", "Control", "Description"]
      .map((item) => headers.includes(item))
      .some((item) => !item);

    if (validInventoryHeaders) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Sheet has invalid headers."] },
      });
    }

    await uploadInventoryFileUseCase(barcode, data as InventorySheetRecord[]);
    return ok({ success: true });
  } catch (error) {
    logger("UploadInventoryFileController", error);
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
