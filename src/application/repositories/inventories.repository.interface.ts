import { Prisma } from "@prisma/client";
import type {
  InventorySchema,
  AuctionInventoryUpdateSchema,
  InventoryInsertSchema,
  INVENTORY_STATUS,
} from "src/entities/models/Inventory";
import { AuctionsInventorySchema } from "src/entities/models/Auction";

export interface IInventoryRepository {
  getInventory: (inventory_id: string) => Promise<InventorySchema>;
  getAuctionItemDetails: (
    auction_inventory_id: string
  ) => Promise<AuctionsInventorySchema | null>;
  getUnsoldInventories: () => Promise<
    Omit<InventorySchema, "histories" | "container" | "auctions_inventories">[]
  >;
  voidItems: (data: {
    auction_inventories: {
      auction_inventory_id: string;
      inventory_id: string;
    }[];
    reason: string;
  }) => Promise<
    Omit<
      AuctionsInventorySchema,
      "auction_bidder" | "inventory" | "receipt" | "histories"
    >[]
  >;
  updateAuctionItem: (data: AuctionInventoryUpdateSchema) => Promise<any>;
  updateInventory: (
    inventory_id: string,
    data: InventoryInsertSchema
  ) => Promise<
    Omit<InventorySchema, "container" | "histories" | "auctions_inventories">
  >;
  getAllInventories: (
    status?: INVENTORY_STATUS[]
  ) => Promise<
    Omit<InventorySchema, "histories" | "auctions_inventories" | "container">[]
  >;
  updateBulkInventoryStatus: (
    status: INVENTORY_STATUS,
    data: string[]
  ) => Promise<Prisma.BatchPayload>;
  getBoughtItems: () => Promise<
    Omit<InventorySchema, "histories" | "container">[]
  >;
}
