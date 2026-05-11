import { ContainerRepository } from "src/infrastructure/di/repositories";
import { getContainerByBarcodeUseCase } from "./get-container-by-barcode.use-case";
import type {
  InventorySheetRecord,
  UploadInventoryFileCreateInput,
  UploadInventoryFileResult,
  UploadInventoryFileUpdateInput,
} from "src/entities/models/Inventory";
import { InputParseError } from "src/entities/errors/common";
import { formatNumberPadding } from "@/app/lib/utils";

export const uploadInventoryFileUseCase = async (
  barcode: string,
  rows: InventorySheetRecord[],
  updated_by?: string,
): Promise<UploadInventoryFileResult> => {
  const container = await getContainerByBarcodeUseCase(barcode);

  const formatted_rows: UploadInventoryFileCreateInput[] = rows.map((item) => ({
    container_id: container.container_id,
    barcode: item.BARCODE,
    control: formatNumberPadding(item.CONTROL.toString(), 4),
    description: item.DESCRIPTION,
    status: "UNSOLD",
  }));

  const deduped_rows = Array.from(
    formatted_rows
      .reduce(
        (acc, item) => acc.set(item.barcode, item),
        new Map<string, UploadInventoryFileCreateInput>(),
      )
      .values(),
  );
  const duplicate_in_file = formatted_rows.length - deduped_rows.length;

  const existing_by_barcode = new Map(
    container.inventories.map((item) => [item.barcode, item]),
  );

  const creates: UploadInventoryFileCreateInput[] = [];
  const updates: UploadInventoryFileUpdateInput[] = [];
  let skipped = 0;
  let unchanged = 0;
  let invalid = 0;

  deduped_rows.forEach((item) => {
    const is_valid_barcode =
      item.barcode.split("-").length === 2 ||
      item.barcode.includes(container.barcode);

    if (!is_valid_barcode) {
      invalid += 1;
      return;
    }

    const existing = existing_by_barcode.get(item.barcode);

    if (!existing) {
      creates.push(item);
      return;
    }

    if (existing.status !== "UNSOLD") {
      skipped += 1;
      return;
    }

    if (
      (existing.control ?? "") === item.control &&
      existing.description === item.description
    ) {
      unchanged += 1;
      return;
    }

    updates.push({
      inventory_id: existing.inventory_id,
      control: item.control,
      description: item.description,
      previous_control: existing.control,
      previous_description: existing.description,
    });
  });

  if (!creates.length && !updates.length && !skipped && !unchanged) {
    throw new InputParseError("Invalid Data!", {
      cause: {
        file: [
          "There are no VALID records in the provided sheet. Please double check the barcode!",
        ],
      },
    });
  }

  const result = await ContainerRepository.uploadInventoryFile({
    creates,
    updates,
    updated_by,
  });

  return {
    ...result,
    skipped,
    unchanged,
    invalid,
    duplicate_in_file,
    total: formatted_rows.length,
  };
};
