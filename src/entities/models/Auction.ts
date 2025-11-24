import { z } from "zod";
import { Prisma } from "@prisma/client";
import { RegisteredBidder } from "./Bidder";
import { type INVENTORY_STATUS } from "./Inventory";

export const AUCTION_ITEM_STATUS = [
  "PAID",
  "UNPAID",
  "CANCELLED",
  "REFUNDED",
  "DISCREPANCY",
] as const;

export type AUCTION_ITEM_STATUS =
  | "PAID"
  | "UNPAID"
  | "CANCELLED"
  | "REFUNDED"
  | "DISCREPANCY";

export type AuctionSchema = Prisma.auctionsGetPayload<{
  include: {
    registered_bidders: {
      include: {
        bidder: true;
        receipt_records: {
          include: { payments: { include: { payment_method: true } } };
        };
        auctions_inventories: {
          include: {
            inventory: { include: { container: true } };
            receipt: true;
            histories: true;
          };
        };
      };
    };
  };
}>;

export type Auction = {
  auction_id: string;
  auction_date: string;
  registered_bidders: RegisteredBidder[];
};

export type AuctionsInventorySchema = Prisma.auctions_inventoriesGetPayload<{
  include: {
    auction_bidder: { include: { bidder: true } };
    inventory: true;
    receipt: true;
    histories: { include: { receipt: true } };
  };
}>;

export type AuctionsInventory = {
  auction_inventory_id: string;
  auction_bidder_id: string;
  inventory_id: string;
  receipt_id: string | null;
  description: string;
  status: AUCTION_ITEM_STATUS;
  price: number;
  qty: string;
  manifest_number: string;
  created_at: string;
  updated_at: string;
  inventory: {
    inventory_id: string;
    barcode: string;
    control: string;
    status: INVENTORY_STATUS;
  };
  bidder: {
    bidder_id: string;
    bidder_number: string;
    full_name: string;
    service_charge: number;
    registration_fee: number;
    already_consumed: number;
    balance: number;
  };
  receipt: {
    receipt_id?: string | null;
    receipt_number?: string | null;
  } | null;
  histories: {
    inventory_history_id: string;
    auction_status: AUCTION_ITEM_STATUS;
    inventory_status: INVENTORY_STATUS;
    remarks: string | null;
    receipt_number: string | null;
    created_at: string;
  }[];
};

export const VoidItemsSchema = z.object({
  auction_inventories: z.array(
    z.object({
      auction_inventory_id: z.string(),
      inventory_id: z.string(),
    })
  ),
  reason: z.string(),
});

export type VoidItemsSchema = z.infer<typeof VoidItemsSchema>;

export type AuctionDateRange = { start: Date; end: Date };
