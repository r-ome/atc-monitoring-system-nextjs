import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import prisma from "@/app/lib/prisma/prisma";
import { InventoryRepository } from "./inventories.repository";
import { patchMethod } from "src/test-utils/patch";
import { InputParseError, NotFoundError } from "src/entities/errors/common";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("searchAuctionItems finds child inventory barcodes from a container barcode search", async () => {
  let capturedWhere: unknown;

  restorers.push(
    patchMethod(
      prisma.auctions_inventories,
      "findMany",
      (async (args: { where: unknown }) => {
        capturedWhere = args.where;
        return [];
      }) as typeof prisma.auctions_inventories.findMany,
    ),
  );

  await InventoryRepository.searchAuctionItems({
    input: {
      raw: "108-03",
      mode: "barcode",
      barcode: "108-03",
    },
    offset: 0,
    limit: 20,
  });

  assert.deepEqual(capturedWhere, {
    inventory: {
      OR: [
        { barcode: "108-03" },
        { barcode: { startsWith: "108-03-" } },
      ],
    },
  });
});

test("updateAuctionItem recalculates affected bidder balances after reassigning an unpaid item", async () => {
  let itemReassigned = false;
  const bidderBalanceWrites: Array<{
    where: { auction_bidder_id: string };
    data: Record<string, unknown>;
  }> = [];

  const tx = {
    auctions_bidders: {
      findFirst: async ({
        where,
      }: {
        where: {
          auction_bidder_id?: string;
          auction_id?: string;
          bidder?: { bidder_number?: string };
        };
      }) => {
        if (
          where.auction_id === "auction-1" &&
          where.bidder?.bidder_number === "0002"
        ) {
          return {
            auction_bidder_id: "new-bidder",
            service_charge: 5,
          };
        }

        if (where.auction_bidder_id === "old-bidder") {
          return {
            auction_bidder_id: "old-bidder",
            balance: 324,
            service_charge: 8,
            registration_fee: 0,
            already_consumed: 1,
            auctions_inventories: itemReassigned
              ? []
              : [
                  {
                    status: "UNPAID",
                    price: 300,
                    histories: [],
                  },
                ],
          };
        }

        if (where.auction_bidder_id === "new-bidder") {
          return {
            auction_bidder_id: "new-bidder",
            balance: 0,
            service_charge: 5,
            registration_fee: 0,
            already_consumed: 1,
            auctions_inventories: itemReassigned
              ? [
                  {
                    status: "UNPAID",
                    price: 300,
                    histories: [],
                  },
                ]
              : [],
          };
        }

        return null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { auction_bidder_id: string };
        data: Record<string, unknown>;
      }) => {
        bidderBalanceWrites.push({ where, data });
        return { where, data };
      },
    },
    containers: {
      findFirst: async () => ({
        container_id: "container-1",
        barcode: "32-04",
        status: null,
      }),
    },
    inventory_histories: {
      create: async () => undefined,
    },
    auctions_inventories: {
      findFirst: async () => ({
        auction_inventory_id: "ai-1",
        inventory_id: "inv-1",
        auction_bidder_id: "old-bidder",
        status: "UNPAID",
        price: 300,
        qty: "1",
        description: "ITEM",
        manifest_number: "M1",
        inventory: {
          inventory_id: "inv-1",
          barcode: "32-04-001",
          control: "0001",
          container_id: "container-1",
          sales_allocation: "CONTAINER",
          sales_allocation_reason: "NORMAL",
          sales_allocation_note: null,
        },
        auction_bidder: {
          bidder: { bidder_number: "0001" },
        },
      }),
      update: async () => {
        itemReassigned = true;
        return undefined;
      },
    },
  };

  restorers.push(
    patchMethod(
      prisma,
      "$transaction",
      (async (...args: unknown[]) => {
        const callback = args[0];
        assert.equal(typeof callback, "function");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (callback as any)(tx);
      }) as typeof prisma.$transaction,
    ),
  );

  await InventoryRepository.updateAuctionItem({
    auction_id: "auction-1",
    auction_inventory_id: "ai-1",
    inventory_id: "inv-1",
    barcode: "32-04-001",
    control: "0001",
    description: "ITEM",
    price: 300,
    qty: "1",
    manifest_number: "M1",
    bidder_number: "0002",
    container_id: "container-1",
  });

  assert.deepEqual(
    bidderBalanceWrites.slice(-2),
    [
      {
        where: { auction_bidder_id: "old-bidder" },
        data: { balance: 0 },
      },
      {
        where: { auction_bidder_id: "new-bidder" },
        data: { balance: 315 },
      },
    ],
  );
});

test("updateAuctionItem rejects lower prices for paid items", async () => {
  let updateCalled = false;
  let containerLookupCalled = false;

  const tx = {
    auctions_bidders: {
      findFirst: async ({
        where,
      }: {
        where: {
          auction_id?: string;
          bidder?: { bidder_number?: string };
        };
      }) => {
        if (
          where.auction_id === "auction-1" &&
          where.bidder?.bidder_number === "0002"
        ) {
          return {
            auction_bidder_id: "bidder-2",
            service_charge: 5,
          };
        }

        return null;
      },
    },
    containers: {
      findFirst: async () => {
        containerLookupCalled = true;
        return null;
      },
    },
    auctions_inventories: {
      findFirst: async () => ({
        auction_inventory_id: "ai-1",
        inventory_id: "inv-1",
        auction_bidder_id: "bidder-1",
        status: "PAID",
        price: 500,
        qty: "1",
        description: "ITEM",
        manifest_number: "M1",
        inventory: {
          inventory_id: "inv-1",
          barcode: "32-04-001",
          control: "0001",
          container_id: "container-1",
          sales_allocation: "CONTAINER",
          sales_allocation_reason: "NORMAL",
          sales_allocation_note: null,
        },
        auction_bidder: {
          bidder: { bidder_number: "0001" },
        },
      }),
      update: async () => {
        updateCalled = true;
        return undefined;
      },
    },
  };

  restorers.push(
    patchMethod(
      prisma,
      "$transaction",
      (async (...args: unknown[]) => {
        const callback = args[0];
        assert.equal(typeof callback, "function");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (callback as any)(tx);
      }) as typeof prisma.$transaction,
    ),
  );

  await assert.rejects(
    () =>
      InventoryRepository.updateAuctionItem({
        auction_id: "auction-1",
        auction_inventory_id: "ai-1",
        inventory_id: "inv-1",
        barcode: "32-04-001",
        control: "0001",
        description: "ITEM",
        price: 400,
        qty: "1",
        manifest_number: "M1",
        bidder_number: "0002",
        container_id: "container-1",
      }),
    (error: unknown) => {
      assert.ok(error instanceof InputParseError);
      assert.match(String(error.cause?.price?.[0]), /refund process/);
      return true;
    },
  );

  assert.equal(updateCalled, false);
  assert.equal(containerLookupCalled, false);
});

test("mergeInventories updates the SOLD barcode, retires the UNSOLD duplicate, and preserves the SOLD auction row", async () => {
  const inventoryUpdates: Array<{
    where: { inventory_id: string };
    data: Record<string, unknown>;
  }> = [];
  const historyCreates: Array<{ data: Record<string, unknown> }> = [];

  const tx = {
    inventories: {
      findFirst: async ({
        where,
      }: {
        where: { inventory_id: string };
      }) => {
        if (where.inventory_id === "sold-two-part") {
          return {
            inventory_id: "sold-two-part",
            barcode: "32-07",
            control: "2834",
            description: "CG",
            status: "SOLD",
            deleted_at: null,
          };
        }

        if (where.inventory_id === "unsold-three-part") {
          return {
            inventory_id: "unsold-three-part",
            barcode: "32-07-671",
            control: "2834",
            description: "CG",
            status: "UNSOLD",
            deleted_at: null,
            container: { barcode: "32-07" },
          };
        }

        return null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { inventory_id: string };
        data: Record<string, unknown>;
      }) => {
        inventoryUpdates.push({ where, data });
        return { where, data };
      },
    },
    auctions_inventories: {
      findFirst: async ({
        where,
      }: {
        where: { inventory_id: string };
      }) => {
        if (where.inventory_id === "sold-two-part") {
          return {
            auction_inventory_id: "auction-inventory-1",
            inventory_id: "sold-two-part",
            description: "CG",
            status: "PAID",
            price: 500,
            qty: "1",
            auction_date: new Date("2026-05-07T00:00:00.000Z"),
            auction_bidder: {
              bidder: { bidder_number: "0784" },
            },
          };
        }

        return null;
      },
      update: async () => {
        throw new Error("SOLD auction row should not be relinked");
      },
      delete: async () => {
        throw new Error("SOLD auction row should not be deleted");
      },
    },
    inventory_histories: {
      updateMany: async () => {
        throw new Error("receipt/history rows should not be rewritten");
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        historyCreates.push({ data });
        return { data };
      },
    },
  };

  restorers.push(
    patchMethod(
      prisma,
      "$transaction",
      (async (...args: unknown[]) => {
        const callback = args[0];
        assert.equal(typeof callback, "function");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (callback as any)(tx);
      }) as typeof prisma.$transaction,
    ),
  );

  const result = await InventoryRepository.mergeInventories({
    old_inventory_id: "sold-two-part",
    new_inventory_id: "unsold-three-part",
  });

  assert.equal(result?.merged_into_barcode, "32-07");
  assert.deepEqual(inventoryUpdates, [
    {
      where: { inventory_id: "sold-two-part" },
      data: {
        barcode: "32-07-671",
      },
    },
    {
      where: { inventory_id: "unsold-three-part" },
      data: {
        deleted_at: inventoryUpdates[1].data.deleted_at,
        description: "MERGED INTO: 32-07-671 (was 32-07, ctrl: 2834)",
      },
    },
  ]);
  assert.ok(inventoryUpdates[1].data.deleted_at instanceof Date);
  assert.deepEqual(historyCreates, [
    {
      data: {
        auction_inventory_id: "auction-inventory-1",
        inventory_id: "sold-two-part",
        auction_status: "DISCREPANCY",
        inventory_status: "SOLD",
        remarks:
          "Item merged: UNSOLD duplicate (barcode: 32-07-671, ctrl: 2834) was merged into SOLD item (barcode: 32-07, ctrl: 2834). SOLD item barcode updated to 32-07-671. UNSOLD duplicate has been soft-deleted.",
      },
    },
  ]);
});

test("mergeInventories rejects UNSOLD duplicates that already have an auction row", async () => {
  const tx = {
    inventories: {
      findFirst: async ({
        where,
      }: {
        where: { inventory_id: string };
      }) => {
        if (where.inventory_id === "sold-two-part") {
          return {
            inventory_id: "sold-two-part",
            barcode: "32-07",
            control: "2834",
            description: "CG",
            status: "SOLD",
            deleted_at: null,
          };
        }

        return {
          inventory_id: "unsold-three-part",
          barcode: "32-07-671",
          control: "2834",
          description: "CG",
          status: "UNSOLD",
          deleted_at: null,
          container: { barcode: "32-07" },
        };
      },
    },
    auctions_inventories: {
      findFirst: async ({
        where,
      }: {
        where: { inventory_id: string };
      }) =>
        where.inventory_id === "sold-two-part"
          ? {
              auction_inventory_id: "auction-inventory-1",
              inventory_id: "sold-two-part",
              description: "CG",
              status: "PAID",
              price: 500,
              qty: "1",
              auction_date: new Date("2026-05-07T00:00:00.000Z"),
              auction_bidder: { bidder: { bidder_number: "0784" } },
            }
          : {
              auction_inventory_id: "duplicate-auction-inventory",
              inventory_id: "unsold-three-part",
              status: "CANCELLED",
              auction_bidder: { bidder: { bidder_number: "5013" } },
            },
    },
    inventory_histories: {
      create: async () => {
        throw new Error("history should not be created for rejected merge");
      },
    },
    inventories_update: async () => {
      throw new Error("inventory should not be updated for rejected merge");
    },
  };

  restorers.push(
    patchMethod(
      prisma,
      "$transaction",
      (async (...args: unknown[]) => {
        const callback = args[0];
        assert.equal(typeof callback, "function");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (callback as any)({
          ...tx,
          inventories: {
            ...tx.inventories,
            update: tx.inventories_update,
          },
        });
      }) as typeof prisma.$transaction,
    ),
  );

  await assert.rejects(
    () =>
      InventoryRepository.mergeInventories({
        old_inventory_id: "sold-two-part",
        new_inventory_id: "unsold-three-part",
      }),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundError);
      assert.match(String(error.message), /already has an auction record/);
      return true;
    },
  );
});

test("applyDirectBoughtItem records direct bought items as paid bought inventory", async () => {
  const auctionDate = new Date("2026-05-22T00:00:00.000Z");
  const auctionInventoryCreates: Array<{ data: Record<string, unknown> }> = [];
  const inventoryUpdates: Array<{
    where: { inventory_id: string };
    data: Record<string, unknown>;
  }> = [];
  const historyCreates: Array<{ data: Record<string, unknown> }> = [];
  const bidderBalanceWrites: Array<{
    where: { auction_bidder_id: string };
    data: Record<string, unknown>;
  }> = [];

  const tx = {
    auctions_bidders: {
      findFirst: async ({
        where,
      }: {
        where: {
          auction_bidder_id?: string;
          auction_id?: string;
          bidder?: { bidder_number?: string };
        };
      }) => {
        if (
          where.auction_id === "auction-1" &&
          where.bidder?.bidder_number === "5013"
        ) {
          return {
            auction_bidder_id: "atc-bidder",
            service_charge: 10,
            registration_fee: 0,
            already_consumed: 1,
          };
        }

        if (where.auction_bidder_id === "atc-bidder") {
          return {
            auction_bidder_id: "atc-bidder",
            service_charge: 10,
            registration_fee: 0,
            already_consumed: 1,
            auctions_inventories: [
              {
                status: "PAID",
                price: 700,
                histories: [],
              },
            ],
          };
        }

        return null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { auction_bidder_id: string };
        data: Record<string, unknown>;
      }) => {
        bidderBalanceWrites.push({ where, data });
        return { where, data };
      },
    },
    inventories: {
      findFirst: async () => ({
        inventory_id: "inventory-1",
        barcode: "25-35-050",
        control: "2400",
        description: "T. BAG",
        status: "UNSOLD",
        auctions_inventory: null,
        container: {
          container_id: "container-1",
          barcode: "25-35",
          status: null,
        },
      }),
      update: async ({
        where,
        data,
      }: {
        where: { inventory_id: string };
        data: Record<string, unknown>;
      }) => {
        inventoryUpdates.push({ where, data });
        return { where, data };
      },
    },
    auctions_inventories: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        auctionInventoryCreates.push({ data });
        return {
          auction_inventory_id: "auction-inventory-1",
          ...data,
        };
      },
    },
    inventory_histories: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        historyCreates.push({ data });
        return { data };
      },
    },
  };

  restorers.push(
    patchMethod(
      prisma,
      "$transaction",
      (async (...args: unknown[]) => {
        const callback = args[0];
        assert.equal(typeof callback, "function");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (callback as any)(tx);
      }) as typeof prisma.$transaction,
    ),
  );

  await InventoryRepository.applyDirectBoughtItem({
    inventory_id: "inventory-1",
    auction_id: "auction-1",
    auction_date: auctionDate.toISOString(),
    price: 700,
    qty: "2",
  });

  assert.equal(auctionInventoryCreates[0].data.status, "PAID");
  assert.equal(historyCreates[0].data.auction_status, "PAID");
  assert.equal(historyCreates[0].data.inventory_status, "BOUGHT_ITEM");
  assert.deepEqual(inventoryUpdates[0], {
    where: { inventory_id: "inventory-1" },
    data: {
      status: "BOUGHT_ITEM",
      is_bought_item: 700,
      auction_date: auctionDate,
      sales_allocation: "CONTAINER",
      sales_allocation_reason: "NORMAL",
      sales_allocation_note: null,
    },
  });
  assert.deepEqual(bidderBalanceWrites, [
    {
      where: { auction_bidder_id: "atc-bidder" },
      data: { balance: 0 },
    },
  ]);
});

test("applyDirectBoughtItem reuses refunded auction rows instead of recreating them", async () => {
  const auctionDate = new Date("2026-05-23T00:00:00.000Z");
  const auctionInventoryCreates: Array<{ data: Record<string, unknown> }> = [];
  const auctionInventoryUpdates: Array<{
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }> = [];
  const inventoryUpdates: Array<{
    where: { inventory_id: string };
    data: Record<string, unknown>;
  }> = [];
  const historyCreates: Array<{ data: Record<string, unknown> }> = [];

  const tx = {
    auctions_bidders: {
      findFirst: async ({
        where,
      }: {
        where: {
          auction_bidder_id?: string;
          auction_id?: string;
          bidder?: { bidder_number?: string };
        };
      }) => {
        if (
          where.auction_id === "auction-1" &&
          where.bidder?.bidder_number === "5013"
        ) {
          return {
            auction_bidder_id: "atc-bidder",
            service_charge: 10,
            registration_fee: 0,
            already_consumed: 1,
          };
        }

        if (where.auction_bidder_id === "atc-bidder") {
          return {
            auction_bidder_id: "atc-bidder",
            service_charge: 10,
            registration_fee: 0,
            already_consumed: 1,
            auctions_inventories: [
              {
                status: "PAID",
                price: 100,
                histories: [],
              },
            ],
          };
        }

        return null;
      },
      update: async () => ({ balance: 0 }),
    },
    inventories: {
      findFirst: async () => ({
        inventory_id: "inventory-1",
        barcode: "43-145-318",
        control: "0180",
        description: "KW",
        status: "UNSOLD",
        auctions_inventory: {
          auction_inventory_id: "refunded-auction-inventory",
          status: "REFUNDED",
          receipt_id: "refund-receipt",
        },
        container: {
          container_id: "container-1",
          barcode: "43-145",
          status: null,
        },
      }),
      update: async ({
        where,
        data,
      }: {
        where: { inventory_id: string };
        data: Record<string, unknown>;
      }) => {
        inventoryUpdates.push({ where, data });
        return { where, data };
      },
    },
    auctions_inventories: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        auctionInventoryCreates.push({ data });
        return {
          auction_inventory_id: "new-auction-inventory",
          ...data,
        };
      },
      update: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        auctionInventoryUpdates.push({ where, data });
        return {
          auction_inventory_id: "refunded-auction-inventory",
          ...data,
        };
      },
      delete: async () => {
        throw new Error("refunded auction row should not be deleted");
      },
    },
    inventory_histories: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        historyCreates.push({ data });
        return { data };
      },
    },
  };

  restorers.push(
    patchMethod(
      prisma,
      "$transaction",
      (async (...args: unknown[]) => {
        const callback = args[0];
        assert.equal(typeof callback, "function");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (callback as any)(tx);
      }) as typeof prisma.$transaction,
    ),
  );

  await InventoryRepository.applyDirectBoughtItem({
    inventory_id: "inventory-1",
    auction_id: "auction-1",
    auction_date: auctionDate.toISOString(),
    price: 100,
    qty: "1",
  });

  assert.equal(auctionInventoryCreates.length, 0);
  assert.deepEqual(auctionInventoryUpdates, [
    {
      where: { auction_inventory_id: "refunded-auction-inventory" },
      data: {
        auction_bidder_id: "atc-bidder",
        description: "KW",
        status: "PAID",
        price: 100,
        qty: "1",
        manifest_number: "BOUGHT ITEM",
        auction_date: auctionDate,
        receipt_id: null,
      },
    },
  ]);
  assert.equal(
    historyCreates[0].data.auction_inventory_id,
    "refunded-auction-inventory",
  );
  assert.equal(historyCreates[0].data.auction_status, "PAID");
  assert.equal(historyCreates[0].data.inventory_status, "BOUGHT_ITEM");
  assert.deepEqual(inventoryUpdates[0], {
    where: { inventory_id: "inventory-1" },
    data: {
      status: "BOUGHT_ITEM",
      is_bought_item: 100,
      auction_date: auctionDate,
      sales_allocation: "CONTAINER",
      sales_allocation_reason: "NORMAL",
      sales_allocation_note: null,
    },
  });
});
