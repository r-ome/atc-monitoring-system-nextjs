import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { uploadInventoryFileUseCase } from "./upload-inventory-file.use-case";
import { ContainerRepository } from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";
import type { UploadInventoryFileWriteInput } from "src/entities/models/Inventory";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("uploadInventoryFileUseCase inserts new rows, updates changed UNSOLD rows, and skips sold rows", async () => {
  let capturedInput: UploadInventoryFileWriteInput | undefined;

  restorers.push(
    patchMethod(
      ContainerRepository,
      "getContainerByBarcode",
      async () =>
        ({
          container_id: "container-1",
          barcode: "32-04",
          inventories: [
            {
              inventory_id: "unsold-1",
              barcode: "32-04-001",
              control: "0001",
              description: "BAG",
              status: "UNSOLD",
            },
            {
              inventory_id: "sold-1",
              barcode: "32-04-002",
              control: "0002",
              description: "SHOES",
              status: "SOLD",
            },
            {
              inventory_id: "bought-1",
              barcode: "32-04-003",
              control: "0003",
              description: "WATCH",
              status: "BOUGHT_ITEM",
            },
            {
              inventory_id: "unchanged-1",
              barcode: "32-04-004",
              control: "0004",
              description: "BELT",
              status: "UNSOLD",
            },
          ],
        }) as never,
    ),
    patchMethod(ContainerRepository, "uploadInventoryFile", async (input) => {
      capturedInput = input;
      return {
        created: input.creates.length,
        updated: input.updates.length,
      };
    }),
  );

  const result = await uploadInventoryFileUseCase(
    "32-04",
    [
      { BARCODE: "32-04-001", CONTROL: "23", DESCRIPTION: "BAG UPDATED" },
      { BARCODE: "32-04-002", CONTROL: "24", DESCRIPTION: "SHOES UPDATED" },
      { BARCODE: "32-04-003", CONTROL: "25", DESCRIPTION: "WATCH UPDATED" },
      { BARCODE: "32-04-004", CONTROL: "0004", DESCRIPTION: "BELT" },
      { BARCODE: "32-04-005", CONTROL: "5", DESCRIPTION: "NEW BAG" },
      { BARCODE: "32-04-006", CONTROL: "6", DESCRIPTION: "FIRST VALUE" },
      { BARCODE: "32-04-006", CONTROL: "7", DESCRIPTION: "LATEST VALUE" },
      { BARCODE: "99-01-001", CONTROL: "8", DESCRIPTION: "WRONG CONTAINER" },
    ],
    "jerome",
  );

  assert.equal(result.created, 2);
  assert.equal(result.updated, 1);
  assert.equal(result.skipped, 2);
  assert.equal(result.unchanged, 1);
  assert.equal(result.invalid, 1);
  assert.equal(result.duplicate_in_file, 1);
  assert.equal(result.total, 8);

  assert.deepEqual(
    capturedInput?.creates.map((item) => ({
      barcode: item.barcode,
      control: item.control,
      description: item.description,
    })),
    [
      { barcode: "32-04-005", control: "0005", description: "NEW BAG" },
      { barcode: "32-04-006", control: "0007", description: "LATEST VALUE" },
    ],
  );
  assert.deepEqual(capturedInput?.updates, [
    {
      inventory_id: "unsold-1",
      control: "0023",
      description: "BAG UPDATED",
      previous_control: "0001",
      previous_description: "BAG",
    },
  ]);
  assert.equal(capturedInput?.updated_by, "jerome");
});
