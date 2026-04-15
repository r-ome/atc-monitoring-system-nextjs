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
