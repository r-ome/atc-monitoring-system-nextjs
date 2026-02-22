import { ContainerRepository } from "src/infrastructure/repositories/containers.repository";
import { getContainerByBarcodeUseCase } from "./get-container-by-barcode.use-case";
import type {
  InventorySheetRecord,
  CreateInventoryInput,
} from "src/entities/models/Inventory";
import { InputParseError } from "src/entities/errors/common";
import { formatNumberPadding } from "@/app/lib/utils";

export const uploadInventoryFileUseCase = async (
  barcode: string,
  rows: InventorySheetRecord[],
) => {
  const container = await getContainerByBarcodeUseCase(barcode);

  const formatted_rows = rows.map((item) => ({
    container_id: container.container_id,
    barcode: item.BARCODE,
    control: formatNumberPadding(item.CONTROL.toString(), 4),
    description: item.DESCRIPTION,
    status: "UNSOLD",
  })) as CreateInventoryInput[];

  const existing_barcode_rows = new Set(
    container.inventories.map((item) => `${item.barcode}`),
  );

  const removed_duplicate_rows = formatted_rows.filter(
    (item) => !existing_barcode_rows.has(item.barcode),
  );

  const removed_invalid_barcode_rows = removed_duplicate_rows.filter((item) => {
    if (item.barcode.split("-").length === 2) return true;
    return item.barcode.includes(container.barcode);
  });

  const valid_rows = removed_invalid_barcode_rows;

  if (!valid_rows.length) {
    throw new InputParseError("Invalid Data!", {
      cause: {
        file: [
          "There are no VALID records in the provided sheet. Please double check the barcode!",
        ],
      },
    });
  }

  return await ContainerRepository.uploadInventoryFile(valid_rows);
};
