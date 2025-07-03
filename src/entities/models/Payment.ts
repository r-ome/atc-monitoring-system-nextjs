import { z } from "zod";
import { AuctionsInventorySchema } from "./Auction";
import { AuctionBidderSchema, BidderSchema } from "./Bidder";
import { Prisma } from "@prisma/client";

export const PAYMENT_PURPOSE = [
  "REGISTRATION",
  "PULL_OUT",
  "REFUNDED",
  "LESS",
] as const;
export const PAYMENT_TYPE = ["CASH", "BDO", "BPI", "GCASH"] as const;

export type PAYMENT_PURPOSE = "REGISTRATION" | "PULL_OUT" | "REFUNDED" | "LESS";
export type PAYMENT_TYPE = "CASH" | "BDO" | "BPI" | "GCASH";
export type PaymentSchema = Prisma.paymentsGetPayload<{
  include: {
    receipt: { include: { auction_bidder: { include: { bidder: true } } } };
  };
}>;

export type Payment = {
  payment_id: string;
  receipt_id: string;
  amount_paid: number;
  payment_type: PAYMENT_TYPE;
  created_at: string;
  auction_date: string;
  receipt: {
    receipt_id: string;
    receipt_number: string;
    purpose: PAYMENT_PURPOSE;
  };
  bidder: {
    bidder_id: string;
    bidder_number: string;
    full_name: string;
  };
};

export type ReceiptRecordsSchema = Prisma.receipt_recordsGetPayload<{
  include: {
    auction_bidder: { include: { bidder: true } };
    auctions_inventories: true;
    payments: true;
    inventory_histories: {
      include: { auction_inventory: { include: { inventory: true } } };
    };
  };
}>;

export type ReceiptRecords = {
  receipt_id: string;
  receipt_number: string;
  auction_bidder_id: string;
  total_amount_paid: number;
  purpose: PAYMENT_PURPOSE;
  auction_date: string;
  remarks?: string | null;
  payments: {
    payment_id: string;
    payment_type: PAYMENT_TYPE;
    amount_paid: number;
    created_at: string;
  }[];
  bidder: {
    bidder_id: string;
    bidder_number: string;
    full_name: string;
    registration_fee: number;
    service_charge: number;
    already_consumed: number;
  };
  auctions_inventories: {
    auction_inventory_id: string | null;
    barcode?: string;
    control?: string;
    description?: string;
    qty?: string;
    price?: number;
    manifest_number?: string;
  }[];
  created_at: string;
};

export const PullOutPaymentInsertSchema = z.object({
  auction_bidder_id: z.string(),
  amount_to_be_paid: z.number(),
  auction_inventory_ids: z.string().array(),
  payments: z.array(
    z.object({
      payment_type: z.enum(PAYMENT_TYPE),
      amount_paid: z.number(),
    })
  ),
  remarks: z.string().optional().nullable(),
});

export type PullOutPaymentInsertSchema = z.infer<
  typeof PullOutPaymentInsertSchema
>;

export type AuctionTransactionSchema = ReceiptRecordsSchema & {
  payments: PaymentSchema[];
  auction_bidder: AuctionBidderSchema & {
    bidder: BidderSchema;
  };
  auctions_inventories: Omit<AuctionsInventorySchema, "inventory">[];
};

export type AuctionTransaction = {
  receipt_id: string;
  receipt_number: string;
  auction_bidder_id: string;
  total_amount_paid: number;
  purpose: PAYMENT_PURPOSE;
  payments: {
    payment_id: string;
    payment_type: PAYMENT_TYPE;
    amount_paid: number;
    created_at: string;
  }[];
  bidder: {
    bidder_id: string;
    bidder_number: string;
    full_name: string;
  };
  created_at: string;
};

export const RefundAuctionInventories = z.object({
  auction_bidder_id: z.string(),
  reason: z.string().min(1, { message: "This field is required!" }),
  auction_inventories: z.array(
    z.object({
      auction_inventory_id: z.string(),
      inventory_id: z.string(),
      prev_price: z.coerce.number(),
      new_price: z.coerce.number(),
    })
  ),
});

export type RefundAuctionInventories = z.infer<typeof RefundAuctionInventories>;
