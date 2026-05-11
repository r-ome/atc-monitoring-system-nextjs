import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { getInventorySheetData, VALID_FILE_TYPES } from "@/app/lib/sheets";
import { uploadInventoryFileUseCase } from "src/application/use-cases/containers/upload-inventory-file.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import type { UploadInventoryFileResult } from "src/entities/models/Inventory";

const buildUploadSummary = (result: UploadInventoryFileResult) => {
  const parts = [
    `${result.created} created`,
    `${result.updated} updated`,
    `${result.skipped} skipped`,
    `${result.unchanged} unchanged`,
  ];

  if (result.duplicate_in_file) {
    parts.push(`${result.duplicate_in_file} duplicate ignored`);
  }

  if (result.invalid) {
    parts.push(`${result.invalid} invalid`);
  }

  return parts.join(", ");
};

export const UploadInventoryFileController = async (
  barcode: string,
  file: File,
) => {
  const ctx = RequestContext.getStore();

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
    const { data, headers } = getInventorySheetData(arrayBuffer);

    if (!data.length) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Sheet that was uploaded has no records."] },
      });
    }

    const hasMissingHeaders = ["Barcode", "Control", "Description"]
      .map((item) => headers.includes(item))
      .some((item) => !item);

    if (hasMissingHeaders) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Sheet has invalid headers."] },
      });
    }

    const result = await uploadInventoryFileUseCase(
      barcode,
      data,
      ctx?.username,
    );
    const summary = buildUploadSummary(result);

    await logActivity(
      "CREATE",
      "inventory",
      barcode,
      `Uploaded inventory file for container ${barcode} (${summary})`,
    );
    return ok({
      success: true,
      message: `Inventory upload complete: ${summary}.`,
      result,
    });
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UploadInventoryFileController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UploadInventoryFileController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UploadInventoryFileController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
