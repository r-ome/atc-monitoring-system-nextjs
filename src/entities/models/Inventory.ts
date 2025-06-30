import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  AUCTION_ITEM_STATUS,
  AuctionsInventory,
  AuctionsInventorySchema,
} from "./Auction";

export const INVENTORY_STATUS = [
  "SOLD",
  "UNSOLD",
  "BOUGHT_ITEM",
  "VOID",
] as const;

export type INVENTORY_STATUS = "SOLD" | "UNSOLD" | "BOUGHT_ITEM" | "VOID";
export type BaseInventorySchema = Prisma.inventoriesGetPayload<{}>;
export type InventorySchema = Prisma.inventoriesGetPayload<{
  include: { histories: true; auctions_inventories: true; container: true };
}>;

export type Inventory = {
  inventory_id: string;
  container: { container_id: string; barcode: string };
  barcode: string;
  control: string;
  description: string;
  status: INVENTORY_STATUS;
  is_bought_item: number;
  url?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  histories: InventoryHistory[];
  auctions_inventories: Omit<AuctionsInventory, "inventory" | "histories">[];
  // histories: InventoryHistorySchema[];
};

export type InventoryHistorySchema = Prisma.inventory_historiesGetPayload<{
  include: { receipt: true };
}>;

export type InventoryHistory = {
  inventory_history_id: string;
  auction_inventory_id: string | null;
  inventory_id: string;
  receipt_id: string | null;
  auction_status: AUCTION_ITEM_STATUS;
  inventory_status: INVENTORY_STATUS;
  remarks?: string | null;
  created_at: string;
};

export const InventoryInsertSchema = z.object({
  container_id: z.string(),
  barcode: z.string(),
  control: z.string().optional().nullable(),
  description: z.string(),
});

export type InventoryInsertSchema = z.infer<typeof InventoryInsertSchema>;
export type InventorySheetRecord = Record<
  "BARCODE" | "CONTROL" | "DESCRIPTION",
  string
>;

export type InventorySheetFormattedRecords = InventoryInsertSchema[];

export const CancelItems = z.object({
  auction_bidder_id: z.string(),
  auction_inventory_ids: z.array(z.string()),
  inventory_ids: z.array(z.string()),
  reason: z.string(),
});

export type CancelItemsSchema = z.infer<typeof CancelItems>;
export const AuctionInventoryUpdateSchema = z.object({
  auction_id: z.string(),
  auction_inventory_id: z.string(),
  inventory_id: z.string(),
  barcode: z.string().min(1, { message: "This field is required" }),
  control: z.string().min(1, { message: "This field is required" }),
  description: z.string().min(1, { message: "This field is required" }),
  price: z.coerce.number(),
  qty: z.string(),
  manifest_number: z.string().optional().nullable(),
  bidder_number: z.string(),
});

export type AuctionInventoryUpdateSchema = z.infer<
  typeof AuctionInventoryUpdateSchema
>;

export type BoughtItems = {
  inventory_id: string;
  barcode: string;
  description: string;
  control: string;
  new_price: number;
  old_price: number;
  bidder_number: string | null;
  qty: string | null;
};
