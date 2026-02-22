import { Prisma } from "@prisma/client";
import type {
  InventoryWithDetailsRow,
  InventoryWithAuctionsInventoryRow,
  InventoryRow,
  UpdateAuctionInventoryInput,
  CreateInventoryInput,
  MergeInventoriesInput,
  InventoryStatus,
} from "src/entities/models/Inventory";
import { AuctionInventoryWithDetailsRow } from "src/entities/models/Auction";

export interface IInventoryRepository {
  getInventory: (inventory_id: string) => Promise<InventoryWithDetailsRow>;
  getAuctionItemDetails: (
    auction_inventory_id: string,
  ) => Promise<AuctionInventoryWithDetailsRow | null>;
  getUnsoldInventories: () => Promise<InventoryRow[]>;
  voidItems: (data: {
    auction_inventories: {
      auction_inventory_id: string;
      inventory_id: string;
    }[];
    reason: string;
  }) => Promise<
    Omit<
      AuctionInventoryWithDetailsRow,
      "auction_bidder" | "inventory" | "receipt" | "histories"
    >[]
  >;
  updateAuctionItem: (data: UpdateAuctionInventoryInput) => void;
  updateInventory: (
    inventory_id: string,
    data: CreateInventoryInput,
  ) => Promise<InventoryRow>;
  getAllInventories: (
    status?: InventoryStatus[],
  ) => Promise<InventoryRow[]>;
  updateBulkInventoryStatus: (
    status: InventoryStatus,
    data: string[],
  ) => Promise<Prisma.BatchPayload>;
  getBoughtItems: () => Promise<InventoryWithAuctionsInventoryRow[]>;
  getInventoryWithNoAuctionInventory: () => Promise<
    InventoryWithAuctionsInventoryRow[]
  >;
  createInventory: (
    data: CreateInventoryInput,
  ) => Promise<InventoryRow>;
  mergeInventories: (data: MergeInventoriesInput) => Promise<void>;
  appendInventories: (
    data: { barcode: string; inventory_id: string }[],
  ) => Promise<void>;
  deleteInventory: (inventory_id: string) => Promise<void>;
}
