import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { updateAuctionItemUseCase } from "./update-auction-item.use-case";
import { ContainerRepository, InventoryRepository } from "src/infrastructure/di/repositories";
import { InputParseError } from "src/entities/errors/common";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("updateAuctionItemUseCase normalizes three-part barcodes and resolves the target container", async () => {
  let delegatedInput: Record<string, unknown> | undefined;

  restorers.push(
    patchMethod(ContainerRepository, "getContainers", async () => [
      {
        container_id: "container-1",
        barcode: "32-04",
        inventories: [],
      },
    ] as never),
    patchMethod(InventoryRepository, "updateAuctionItem", async (input) => {
      delegatedInput = input as never;
      return input as never;
    }),
  );

  await updateAuctionItemUseCase({
    auction_id: "auction-1",
    auction_inventory_id: "ai-1",
    inventory_id: "inv-1",
    barcode: "32-04-1",
    control: "0001",
    description: "ITEM",
    price: 1000,
    qty: "1",
    manifest_number: "M1",
    bidder_number: "0007",
  });

  assert.equal(delegatedInput?.barcode, "32-04-001");
  assert.equal(delegatedInput?.control, "0001");
  assert.equal(delegatedInput?.container_id, "container-1");
});

test("updateAuctionItemUseCase normalizes control before duplicate checks and persistence", async () => {
  let delegatedInput: Record<string, unknown> | undefined;

  restorers.push(
    patchMethod(ContainerRepository, "getContainers", async () => [
      {
        container_id: "container-1",
        barcode: "32-04",
        inventories: [
          { inventory_id: "same-1", barcode: "32-04", control: "0050" },
        ],
      },
    ] as never),
    patchMethod(InventoryRepository, "updateAuctionItem", async (input) => {
      delegatedInput = input as never;
      return input as never;
    }),
  );

  await updateAuctionItemUseCase({
    auction_id: "auction-1",
    auction_inventory_id: "ai-1",
    inventory_id: "same-1",
    barcode: "32-04",
    control: "50",
    description: "ITEM",
    price: 1000,
    qty: "1",
    manifest_number: "M1",
    bidder_number: "0007",
  });

  assert.equal(delegatedInput?.control, "0050");
});

test("updateAuctionItemUseCase rejects missing containers and barcode collisions according to barcode shape", async () => {
  restorers.push(
    patchMethod(ContainerRepository, "getContainers", async () => [
      {
        container_id: "container-1",
        barcode: "32-04",
        inventories: [
          { inventory_id: "other-1", barcode: "32-04-001", control: "0001" },
          { inventory_id: "other-2", barcode: "32-04", control: "0002" },
        ],
      },
    ] as never),
  );

  await assert.rejects(
    () =>
      updateAuctionItemUseCase({
        auction_id: "auction-1",
        auction_inventory_id: "ai-1",
        inventory_id: "inv-1",
        barcode: "99-01-001",
        control: "0001",
        description: "ITEM",
        price: 1000,
        qty: "1",
        manifest_number: "M1",
        bidder_number: "0007",
      }),
    (error: unknown) => {
      assert.ok(error instanceof InputParseError);
      assert.match(String(error.cause?.barcode?.[0]), /Container Barcode\(99-01\) does not exist/);
      return true;
    },
  );

  await assert.rejects(
    () =>
      updateAuctionItemUseCase({
        auction_id: "auction-1",
        auction_inventory_id: "ai-1",
        inventory_id: "inv-1",
        barcode: "32-04-001",
        control: "0001",
        description: "ITEM",
        price: 1000,
        qty: "1",
        manifest_number: "M1",
        bidder_number: "0007",
      }),
    (error: unknown) => {
      assert.ok(error instanceof InputParseError);
      assert.match(String(error.cause?.barcode?.[0]), /Barcode 32-04-001 already taken/);
      return true;
    },
  );

  await assert.rejects(
    () =>
      updateAuctionItemUseCase({
        auction_id: "auction-1",
        auction_inventory_id: "ai-1",
        inventory_id: "inv-1",
        barcode: "32-04",
        control: "0002",
        description: "ITEM",
        price: 1000,
        qty: "1",
        manifest_number: "M1",
        bidder_number: "0007",
      }),
    (error: unknown) => {
      assert.ok(error instanceof InputParseError);
      assert.match(String(error.cause?.barcode?.[0]), /Barcode 32-04 with Control 0002 already taken/);
      assert.match(String(error.cause?.control?.[0]), /Control 0002 already taken/);
      return true;
    },
  );
});
