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
  const inventoryStatusWrites: Array<Record<string, unknown>> = [];

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
    inventories: {
      updateMany: async (args: Record<string, unknown>) => {
        inventoryStatusWrites.push(args);
        return { count: 1 };
      },
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
  assert.deepEqual(inventoryStatusWrites, [
    {
      where: {
        inventory_id: { in: ["inv-1"] },
        status: "UNSOLD",
      },
      data: { status: "SOLD" },
    },
  ]);
});

test("handleBidderPullOut marks previously unsold paid inventories as sold", async () => {
  const receiptWrites: Array<Record<string, unknown>> = [];
  const auctionStatusWrites: Array<Record<string, unknown>> = [];
  const inventoryStatusWrites: Array<Record<string, unknown>> = [];

  const tx = {
    auctions_bidders: {
      findFirst: async () => ({
        auction_bidder_id: "bidder-0060",
        service_charge: 0,
        registration_fee: 0,
        already_consumed: 1,
        bidder: { bidder_id: "bidder-row-0060", bidder_number: "0060" },
      }),
      update: async () => ({}),
    },
    auctions_inventories: {
      findMany: async () => [
        {
          auction_inventory_id: "ai-refunded-then-paid",
          inventory_id: "inv-unsold",
          status: "UNPAID",
          price: 1000,
          histories: [
            {
              auction_status: "REFUNDED",
              inventory_status: "UNSOLD",
              remarks: "FULL REFUND: BIDDER 0060.",
              created_at: new Date("2026-01-17T02:56:05.000Z"),
            },
          ],
        },
      ],
      updateMany: async (args: Record<string, unknown>) => {
        auctionStatusWrites.push(args);
        return { count: 1 };
      },
    },
    inventories: {
      updateMany: async (args: Record<string, unknown>) => {
        inventoryStatusWrites.push(args);
        return { count: 1 };
      },
    },
    receipt_records: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        receiptWrites.push(data);
        return { receipt_id: "receipt-0060-1" };
      },
    },
    payments: {
      create: async () => ({}),
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
    auction_bidder_id: "bidder-0060",
    auction_inventory_ids: ["ai-refunded-then-paid"],
    amount_to_be_paid: 1000,
    payments: [{ payment_method: "cash", amount_paid: 1000 }],
    storage_fee: 0,
  });

  assert.deepEqual(auctionStatusWrites, [
    {
      data: {
        receipt_id: "receipt-0060-1",
        status: "PAID",
      },
      where: {
        auction_inventory_id: { in: ["ai-refunded-then-paid"] },
      },
    },
  ]);
  assert.deepEqual(inventoryStatusWrites, [
    {
      where: {
        inventory_id: { in: ["inv-unsold"] },
        status: "UNSOLD",
      },
      data: { status: "SOLD" },
    },
  ]);
  assert.deepEqual(receiptWrites[0].inventory_histories, {
    create: [
      {
        auction_inventory_id: "ai-refunded-then-paid",
        inventory_id: "inv-unsold",
        auction_status: "PAID",
        inventory_status: "SOLD",
        remarks: "Pull-out paid",
      },
    ],
  });
});

test("updatePaymentMethod updates a non-registration payment by payment id only", async () => {
  const paymentFindArgs: Array<Record<string, unknown>> = [];
  const paymentMethodFindArgs: Array<Record<string, unknown>> = [];
  const paymentUpdateArgs: Array<Record<string, unknown>> = [];

  restorers.push(
    patchMethod(
      prisma.payments,
      "findFirst",
      (async (args: Record<string, unknown>) => {
        paymentFindArgs.push(args);
        return {
          payment_id: "payment-1",
          receipt_id: "receipt-1",
          amount_paid: 1250,
          payment_method_id: "cash",
          remarks: "Original remarks",
          payment_method: { name: "Cash" },
        };
      }) as unknown as typeof prisma.payments.findFirst,
    ),
    patchMethod(
      prisma.payment_methods,
      "findFirst",
      (async (args: Record<string, unknown>) => {
        paymentMethodFindArgs.push(args);
        return { payment_method_id: "gcash", name: "GCash" };
      }) as typeof prisma.payment_methods.findFirst,
    ),
    patchMethod(
      prisma.payments,
      "update",
      (async (args: Record<string, unknown>) => {
        paymentUpdateArgs.push(args);
        return args;
      }) as typeof prisma.payments.update,
    ),
  );

  await PaymentRepository.updatePaymentMethod("payment-1", {
    payment_method: "gcash",
  });

  assert.deepEqual(paymentFindArgs, [
    {
      where: { payment_id: "payment-1" },
      include: { payment_method: true },
    },
  ]);
  assert.deepEqual(paymentMethodFindArgs, [
    { where: { payment_method_id: "gcash" } },
  ]);
  assert.deepEqual(paymentUpdateArgs, [
    {
      where: { payment_id: "payment-1" },
      data: {
        payment_method_id: "gcash",
        remarks: "Updated payment type from Cash to GCash",
      },
    },
  ]);
});
