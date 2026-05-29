import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  ContainerRepository,
  InventoryRepository,
} from "src/infrastructure/di/repositories";
import { InputParseError } from "src/entities/errors/common";
import { createInventoryUseCase } from "./create-inventory.use-case";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("createInventoryUseCase rejects barcodes outside the container pattern", async () => {
  restorers.push(
    patchMethod(
      ContainerRepository,
      "getContainerById",
      async () =>
        ({
          container_id: "container-1",
          barcode: "32-04",
          inventories: [],
        }) as never,
    ),
  );

  await assert.rejects(
    () =>
      createInventoryUseCase({
        container_id: "container-1",
        barcode: "-32-04-123",
        control: "1",
        description: "BAG",
      }),
    (error) => {
      assert.ok(error instanceof InputParseError);
      assert.deepEqual(error.cause, {
        barcode: ["Barcode must be 32-04 or 32-04-###."],
      });
      return true;
    },
  );
});

test("createInventoryUseCase normalizes valid container inventory barcodes", async () => {
  let createdBarcode: string | undefined;

  restorers.push(
    patchMethod(
      ContainerRepository,
      "getContainerById",
      async () =>
        ({
          container_id: "container-1",
          barcode: "32-04",
          inventories: [],
        }) as never,
    ),
    patchMethod(InventoryRepository, "createInventory", async (input) => {
      createdBarcode = input.barcode;
      return { inventory_id: "inventory-1", ...input } as never;
    }),
  );

  await createInventoryUseCase({
    container_id: "container-1",
    barcode: " 32-04-7 ",
    control: "1",
    description: "BAG",
  });

  assert.equal(createdBarcode, "32-04-007");
});
