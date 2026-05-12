import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AuctionItemStatus, AuctionsInventory } from "./Auction";

export const INVENTORY_STATUS = [
  "SOLD",
  "UNSOLD",
  "BOUGHT_ITEM",
  "VOID",
] as const;

export type InventoryStatus = (typeof INVENTORY_STATUS)[number];

export type InventoryRow = Prisma.inventoriesGetPayload<object>;

export type InventoryForManifestRow = Prisma.inventoriesGetPayload<{
  select: {
    inventory_id: true;
    container_id: true;
    barcode: true;
    control: true;
    status: true;
    auction_date: true;
    auctions_inventory: {
      select: {
        auction_bidder: {
          select: {
            auction_id: true;
            bidder: {
              select: {
                bidder_number: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export type InventoryWithDetailsRow = Prisma.inventoriesGetPayload<{
  include: {
    histories: { include: { receipt: true } };
    auctions_inventory: true;
    container: true;
  };
}>;

export type InventoryWithAuctionsInventoryRow = Prisma.inventoriesGetPayload<{
  include: { auctions_inventory: true };
}>;

export type Inventory = {
  inventory_id: string;
  container: { container_id: string; barcode: string };
  barcode: string;
  control: string;
  description: string;
  status: InventoryStatus;
  is_bought_item: number;
  url?: string | null;
  auction_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  histories: InventoryHistoryWithReceiptRow[];
  auctions_inventory: Omit<AuctionsInventory, "inventory" | "histories"> | null;
};

export type InventoryHistoryWithReceiptRow =
  Prisma.inventory_historiesGetPayload<{
    include: { receipt: true };
  }>;

export type InventoryHistory = {
  inventory_history_id: string;
  auction_inventory_id: string | null;
  inventory_id: string;
  receipt_id: string | null;
  auction_status: AuctionItemStatus;
  inventory_status: InventoryStatus;
  remarks?: string | null;
  created_at: string;
};

export const createInventorySchema = z.object({
  container_id: z.string(),
  barcode: z.string(),
  control: z.string(),
  description: z.string(),
});
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;

export type UploadInventoryFileCreateInput = CreateInventoryInput & {
  status: "UNSOLD";
};

export type UploadInventoryFileUpdateInput = {
  inventory_id: string;
  control: string;
  description: string;
  previous_control: string | null;
  previous_description: string;
};

export type UploadInventoryFileWriteInput = {
  creates: UploadInventoryFileCreateInput[];
  updates: UploadInventoryFileUpdateInput[];
  updated_by?: string;
};

export type UploadInventoryFileWriteResult = {
  created: number;
  updated: number;
};

export type UploadInventoryFileResult = UploadInventoryFileWriteResult & {
  skipped: number;
  unchanged: number;
  invalid: number;
  duplicate_in_file: number;
  total: number;
};

export type InventorySheetRecord = Record<
  "BARCODE" | "CONTROL" | "DESCRIPTION",
  string
>;

export const cancelItemsSchema = z.object({
  auction_bidder_id: z.string(),
  auction_inventory_ids: z.array(z.string()),
  inventory_ids: z.array(z.string()),
  reason: z.string(),
});
export type CancelItemsInput = z.infer<typeof cancelItemsSchema>;

export const updateAuctionInventorySchema = z.object({
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
  container_id: z.string().optional().nullable(),
});
export type UpdateAuctionInventoryInput = z.infer<
  typeof updateAuctionInventorySchema
>;

export type BoughtItems = {
  inventory_id: string;
  barcode: string;
  description?: string;
  control: string;
  auction_date: string | null;
  created_at: string | null;
  new_price?: number;
  old_price: number | null;
  profit_loss: number | null;
  bidder_number: string | null;
  qty: string | null;
};

export const mergeInventoriesSchema = z.object({
  old_inventory_id: z.string(),
  new_inventory_id: z.string(),
  control_choice: z.enum(["UNSOLD", "SOLD"]).optional(),
});
export type MergeInventoriesInput = z.infer<typeof mergeInventoriesSchema>;

export type MergeInventoriesActivityItem = {
  barcode: string;
  control: string;
  description: string;
  price: string;
  bidder_number: string;
};

export type MergeInventoriesResult = {
  merged_into_barcode: string;
  items: MergeInventoriesActivityItem[];
};
