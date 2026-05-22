import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import prisma from "@/app/lib/prisma/prisma";
import { InventoryRepository } from "./inventories.repository";
import { patchMethod } from "src/test-utils/patch";

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
