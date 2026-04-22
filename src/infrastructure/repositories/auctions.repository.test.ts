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

test("uploadManifest does not increment bidder balance for bought items", async () => {
  const bidderBalanceWrites: Array<{
    where: { auction_bidder_id: string };
    data: Record<string, unknown>;
  }> = [];

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
      createMany: async () => ({ count: 1 }),
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
  );

  assert.deepEqual(bidderBalanceWrites, []);
});
