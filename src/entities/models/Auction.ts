import { z } from "zod";
import { Prisma } from "@prisma/client";
import { RegisteredBidder } from "./Bidder";
import { type InventoryStatus } from "./Inventory";
export type Override<T, R> = Omit<T, keyof R> & R;

export const AUCTION_ITEM_STATUS = [
  "PAID",
  "UNPAID",
  "CANCELLED",
  "REFUNDED",
  "DISCREPANCY",
  "PARTIAL",
] as const;

export type AuctionItemStatus = (typeof AUCTION_ITEM_STATUS)[number];

export type AuctionRow = Prisma.auctionsGetPayload<object>;

export type AuctionWithSalesRow = Prisma.auctionsGetPayload<{
  include: {
    branch: true;
    registered_bidders: { include: { auctions_inventories: true } };
  };
}>;

export type AuctionWithDetailsRow = Prisma.auctionsGetPayload<{
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

export type AuctionInventoryRow = Prisma.auctions_inventoriesGetPayload<object>;

export type AuctionInventoryWithDetailsRow =
  Prisma.auctions_inventoriesGetPayload<{
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
  status: AuctionItemStatus;
  price: number;
  qty: string;
  manifest_number: string;
  is_slash_item: string | null;
  created_at: string;
  updated_at: string;
  auction_date: string;
  inventory: {
    inventory_id: string;
    barcode: string;
    control: string;
    status: InventoryStatus;
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
    auction_status: AuctionItemStatus;
    inventory_status: InventoryStatus;
    remarks: string | null;
    receipt_number: string | null;
    created_at: string;
  }[];
};

export const voidItemsSchema = z.object({
  auction_inventories: z.array(
    z.object({
      auction_inventory_id: z.string(),
      inventory_id: z.string(),
    }),
  ),
  reason: z.string(),
});
export type VoidItemsInput = z.infer<typeof voidItemsSchema>;

export type AuctionDateRange = { start: Date; end: Date };
