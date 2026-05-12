import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import prisma from "@/app/lib/prisma/prisma";
import { AuctionRepository } from "./auctions.repository";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("updateManifest persists the normalized row barcode on the manifest record", async () => {
  let manifestUpdateData: Record<string, unknown> | undefined;

  const tx = {
    manifest_records: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        manifestUpdateData = data;
        return {
          manifest_id: "manifest-1",
          auction_id: "auction-1",
          ...data,
        };
      },
    },
    auctions: {
      findFirst: async () => ({
        auction_id: "auction-1",
        created_at: new Date("2026-04-11T00:00:00.000Z"),
      }),
    },
    inventories: {
      createMany: async () => ({ count: 0 }),
      findMany: async () => [],
      updateMany: async () => ({ count: 1 }),
    },
    auctions_inventories: {
      create: async () => ({
        auction_inventory_id: "auction-inventory-1",
      }),
      update: async () => ({
        auction_inventory_id: "auction-inventory-1",
      }),
      findMany: async () => [],
    },
    inventory_histories: {
      createMany: async () => ({ count: 1 }),
    },
    auctions_bidders: {
      update: async () => ({ auction_bidder_id: "ab-1" }),
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

  await AuctionRepository.updateManifest(
    "manifest-1",
    [
      {
        manifest_id: "manifest-1",
        barcode: "108-03-059",
        control: "0001",
        description: "ITEM",
        bidder_number: "0007",
        price: "100",
        qty: "1",
        manifest_number: "M-1",
        auction_bidder_id: "ab-1",
        service_charge: 0,
        inventory_id: "inventory-1",
        auction_inventory_id: "auction-inventory-1",
        isValid: true,
        forUpdating: true,
        error: "",
        isSlashItem: null,
      },
    ],
    {
      manifest_id: "manifest-1",
      barcode: "108-03-59",
      control: "1",
      description: "ITEM",
      bidder_number: "7",
      price: "100",
      qty: "1",
      manifest_number: "M-1",
      error: "",
    },
  );

  assert.equal(manifestUpdateData?.barcode, "108-03-059");
});

test("uploadManifest does not increment bidder balance for bought items", async () => {
  const bidderBalanceWrites: Array<{
    where: { auction_bidder_id: string };
    data: Record<string, unknown>;
  }> = [];
  const historyWrites: Array<unknown[]> = [];

  const tx = {
    auctions: {
      findFirst: async () => ({
        auction_id: "auction-1",
        created_at: new Date("2026-04-11T00:00:00.000Z"),
      }),
    },
    manifest_records: {
      createMany: async () => ({ count: 1 }),
    },
    inventories: {
      createMany: async () => ({ count: 1 }),
      findMany: async () => [
        {
          inventory_id: "inventory-1",
          barcode: "32-04-001",
          control: "0001",
        },
      ],
      update: async () => ({
        inventory_id: "inventory-1",
      }),
    },
    auctions_inventories: {
      create: async () => ({
        auction_inventory_id: "auction-inventory-1",
        inventory_id: "inventory-1",
      }),
      findMany: async () => [
        {
          auction_inventory_id: "auction-inventory-1",
          inventory_id: "inventory-1",
          status: "PAID",
          inventory: {
            status: "BOUGHT_ITEM",
          },
          histories: [],
        },
      ],
      update: async () => ({
        auction_inventory_id: "auction-inventory-1",
      }),
    },
    inventory_histories: {
      createMany: async ({ data }: { data: unknown[] }) => {
        historyWrites.push(data);
        return { count: data.length };
      },
    },
    auctions_bidders: {
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

  await AuctionRepository.uploadManifest(
    "auction-1",
    [
      {
        BARCODE: "32-04-001",
        CONTROL: "0001",
        DESCRIPTION: "ITEM A",
        BIDDER: "5013",
        PRICE: "1000",
        QTY: "1",
        MANIFEST: "BOUGHT ITEM",
        isValid: true,
        forUpdating: false,
        isSlashItem: null,
        error: "",
        auction_bidder_id: "atc-bidder",
        service_charge: 0,
        container_id: "container-1",
      },
    ],
    true,
    "JUDY",
  );

  assert.deepEqual(bidderBalanceWrites, []);
  assert.deepEqual(historyWrites, [
    [
      {
        auction_inventory_id: "auction-inventory-1",
        inventory_id: "inventory-1",
        auction_status: "PAID",
        inventory_status: "BOUGHT_ITEM",
        remarks: "Bought item encoded | Updated by: JUDY",
      },
    ],
  ]);
});

test("uploadManifest re-encodes bought items as sold inventory and updates the existing auction item", async () => {
  const auctionDate = new Date("2026-04-25T00:00:00.000Z");
  const inventoryUpdates: Array<{
    where: { inventory_id: string };
    data: Record<string, unknown>;
  }> = [];
  const auctionInventoryUpdates: Array<{
    where: { auction_inventory_id: string };
    data: Record<string, unknown>;
  }> = [];
  const historyWrites: Array<unknown[]> = [];
  const bidderBalanceWrites: Array<{
    where: { auction_bidder_id: string };
    data: Record<string, unknown>;
  }> = [];

  let auctionInventoryFindManyCalls = 0;

  const tx = {
    auctions: {
      findFirst: async () => ({
        auction_id: "auction-2026-04-25",
        created_at: auctionDate,
      }),
    },
    manifest_records: {
      createMany: async () => ({ count: 1 }),
    },
    inventories: {
      createMany: async () => ({ count: 0 }),
      findMany: async () => [],
      update: async ({
        where,
        data,
      }: {
        where: { inventory_id: string };
        data: Record<string, unknown>;
      }) => {
        inventoryUpdates.push({ where, data });
        return { inventory_id: where.inventory_id, ...data };
      },
    },
    auctions_inventories: {
      create: async () => {
        throw new Error("Should reuse the existing auction inventory");
      },
      findMany: async () => {
        auctionInventoryFindManyCalls += 1;

        if (auctionInventoryFindManyCalls === 1) {
          return [
            {
              auction_inventory_id: "auction-inventory-1",
              inventory_id: "inventory-1",
              status: "PAID",
              inventory: {
                status: "BOUGHT_ITEM",
              },
              histories: [],
            },
          ];
        }

        return [
          {
            auction_inventory_id: "auction-inventory-1",
            inventory_id: "inventory-1",
            status: "UNPAID",
            inventory: {
              status: "SOLD",
            },
            histories: [],
          },
        ];
      },
      update: async ({
        where,
        data,
      }: {
        where: { auction_inventory_id: string };
        data: Record<string, unknown>;
      }) => {
        auctionInventoryUpdates.push({ where, data });
        return { auction_inventory_id: where.auction_inventory_id, ...data };
      },
    },
    inventory_histories: {
      createMany: async ({ data }: { data: unknown[] }) => {
        historyWrites.push(data);
        return { count: data.length };
      },
    },
    auctions_bidders: {
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

  await AuctionRepository.uploadManifest(
    "auction-2026-04-25",
    [
      {
        BARCODE: "25-35-050",
        CONTROL: "2400",
        DESCRIPTION: "T. BAG",
        BIDDER: "0860",
        PRICE: "700",
        QTY: "2",
        MANIFEST: "J33",
        isValid: true,
        forUpdating: true,
        isSlashItem: null,
        error: "",
        auction_bidder_id: "bidder-0860",
        auction_inventory_id: "auction-inventory-1",
        inventory_id: "inventory-1",
        service_charge: 10,
        container_id: "container-1",
      },
    ],
    false,
    "JUDY",
  );

  assert.deepEqual(inventoryUpdates, [
    {
      where: { inventory_id: "inventory-1" },
      data: {
        control: "2400",
        status: "SOLD",
        auction_date: auctionDate,
      },
    },
  ]);
  assert.deepEqual(auctionInventoryUpdates, [
    {
      where: { auction_inventory_id: "auction-inventory-1" },
      data: {
        auction_bidder_id: "bidder-0860",
        description: "T. BAG",
        price: 700,
        qty: "2",
        manifest_number: "J33",
        status: "UNPAID",
        auction_date: auctionDate,
        is_slash_item: null,
      },
    },
  ]);
  assert.deepEqual(historyWrites, [
    [
      {
        auction_inventory_id: "auction-inventory-1",
        inventory_id: "inventory-1",
        auction_status: "UNPAID",
        inventory_status: "SOLD",
        remarks: "Item encoded again | Previous status: BOUGHT_ITEM",
      },
    ],
  ]);
  assert.deepEqual(bidderBalanceWrites, [
    {
      where: { auction_bidder_id: "bidder-0860" },
      data: { balance: { increment: 770 } },
    },
  ]);
});
