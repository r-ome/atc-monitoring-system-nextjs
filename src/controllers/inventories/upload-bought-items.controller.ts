import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { getSheetData, VALID_FILE_TYPES } from "@/app/lib/sheets";
import { uploadBoughtItemsUseCase } from "src/application/use-cases/inventories/upload-bought-items.use-case";
import { BoughtItemsSheetRecord } from "src/entities/models/Manifest";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";

function buildBoughtItemsUploadLogDescription(data: Record<string, string>[]) {
  return JSON.stringify({
    type: "bought_items_upload",
    summary: `Uploaded bought items: ${data.length} records`,
    items: data.map((item) => ({
      barcode: item.BARCODE?.toString() ?? "",
      control: item.CONTROL?.toString() ?? "",
      price: item.OLD_PRICE?.toString() ?? "",
    })),
  });
}

export const UploadBoughtItemsController = async (
  branch_id: string,
  file: File,
  uploaded_by?: string,
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
    const { data, headers } = getSheetData(arrayBuffer, "bought_items");

    if (!data.length) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Sheet that was uploaded has no records."] },
      });
    }

    const validLegacyHeaders = JSON.stringify([
      "BARCODE",
      "CONTROL",
      "DESCRIPTION",
      "OLD PRICE",
      "NEW PRICE",
    ]);
    const validCurrentHeaders = JSON.stringify([
      "BARCODE",
      "CONTROL",
      "DESCRIPTION",
      "OLD PRICE",
    ]);

    if (
      validLegacyHeaders !== JSON.stringify(headers) &&
      validCurrentHeaders !== JSON.stringify(headers)
    ) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Sheet has invalid headers."] },
      });
    }

    await uploadBoughtItemsUseCase(
      branch_id,
      data as BoughtItemsSheetRecord[],
      uploaded_by,
    );
    await logActivity(
      "CREATE",
      "bought_item",
      "bulk",
      buildBoughtItemsUploadLogDescription(data),
    );
    return ok({ success: true });
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UploadBoughtItemsController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UploadBoughtItemsController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UploadBoughtItemsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
