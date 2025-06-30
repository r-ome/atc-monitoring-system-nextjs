import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Response";
import { getSheetData, VALID_FILE_TYPES } from "@/app/lib/sheets";
import { uploadBoughtItemsUseCase } from "src/application/use-cases/inventories/upload-bought-items.use-case";
import { BoughtItemsSheetRecord } from "src/entities/models/Manifest";

export const UploadBoughtItemsController = async (file: File) => {
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

    const validInventoryHeaders = JSON.stringify([
      "BARCODE",
      "CONTROL",
      "DESCRIPTION",
      "OLD PRICE",
      "NEW PRICE",
    ]);

    if (validInventoryHeaders !== JSON.stringify(headers)) {
      throw new InputParseError("Invalid Data!", {
        cause: { file: ["Sheet has invalid headers."] },
      });
    }

    const formattedData = data.map((item) => ({
      BARCODE: item.BARCODE,
      CONTROL: item.CONTROL,
      DESCRIPTION: item.DESCRIPTION,
      OLD_PRICE: item["OLD PRICE"],
      NEW_PRICE: item["NEW PRICE"],
    }));

    await uploadBoughtItemsUseCase(formattedData as BoughtItemsSheetRecord[]);
    return ok({ success: true });
  } catch (error) {
    if (error instanceof InputParseError) {
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
