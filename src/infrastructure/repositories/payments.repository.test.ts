import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import prisma from "@/app/lib/prisma/prisma";
import { PaymentRepository } from "./payments.repository";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("getPaymentsByDate uses Manila day boundaries for the query window", async () => {
  const queryArgs: Array<Record<string, unknown>> = [];

  restorers.push(
    patchMethod(
      prisma.payments,
      "findMany",
      (async (args: Record<string, unknown>) => {
        queryArgs.push(args);
        return [];
      }) as typeof prisma.payments.findMany,
    ),
  );

  await PaymentRepository.getPaymentsByDate(
    new Date("2026-05-02T00:00:00.000Z"),
    "branch-1",
  );

  assert.equal(queryArgs.length, 1);
  const where = queryArgs[0].where as {
    created_at: { gte: Date; lte: Date };
    receipt: { auction_bidder: { auctions: { branch_id: string } } };
  };

  assert.equal(where.created_at.gte.toISOString(), "2026-05-01T16:00:00.000Z");
  assert.equal(where.created_at.lte.toISOString(), "2026-05-02T15:59:59.999Z");
  assert.equal(where.receipt.auction_bidder.auctions.branch_id, "branch-1");
});

test("handleBidderPullOut charges only the partial price delta for add-on payments", async () => {
  const paymentWrites: Array<Record<string, unknown>> = [];
  const bidderBalanceWrites: Array<{
    where: { auction_bidder_id: string };
    data: Record<string, unknown>;
  }> = [];

  const tx = {
    auctions_bidders: {
      findFirst: async () => ({
        auction_bidder_id: "bidder-0203",
        service_charge: 5,
        registration_fee: 3000,
        already_consumed: 1,
        bidder: { bidder_number: "0203" },
      }),
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
      findMany: async () => [
        {
          auction_inventory_id: "ai-1",
          inventory_id: "inv-1",
          status: "PARTIAL",
          price: 5900,
          histories: [
            {
              remarks: "Item updated | Price: 500 → 5900 | Updated by: RHEA",
              created_at: new Date("2026-04-27T06:27:05.000Z"),
            },
          ],
        },
      ],
      updateMany: async () => ({ count: 1 }),
    },
    receipt_records: {
      findFirst: async () => null,
      create: async () => ({ receipt_id: "receipt-1" }),
    },
    payments: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        paymentWrites.push(data);
        return data;
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

  await PaymentRepository.handleBidderPullOut({
    auction_bidder_id: "bidder-0203",
    auction_inventory_ids: ["ai-1"],
    amount_to_be_paid: 5670,
    payments: [{ payment_method: "cash", amount_paid: 5670 }],
    storage_fee: 0,
  });

  assert.deepEqual(paymentWrites, [
    {
      receipt_id: "receipt-1",
      amount_paid: 5670,
      payment_method_id: "cash",
    },
  ]);
  assert.deepEqual(bidderBalanceWrites, [
    {
      where: { auction_bidder_id: "bidder-0203" },
      data: { balance: { decrement: 5670 }, already_consumed: 1 },
    },
  ]);
});
