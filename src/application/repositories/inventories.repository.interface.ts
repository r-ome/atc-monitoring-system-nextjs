import { Prisma } from "@prisma/client";
import type {
  InventoryWithDetailsRow,
  InventoryWithAuctionsInventoryRow,
  InventoryRow,
  InventoryForManifestRow,
  UpdateAuctionInventoryInput,
  CreateInventoryInput,
  MergeInventoriesInput,
  InventoryStatus,
} from "src/entities/models/Inventory";
import {
  AuctionInventorySearchInput,
  AuctionInventorySearchRow,
  AuctionInventoryWithDetailsRow,
} from "src/entities/models/Auction";

export interface IInventoryRepository {
  getInventory: (inventory_id: string) => Promise<InventoryWithDetailsRow>;
  getAuctionItemDetails: (
    auction_inventory_id: string,
  ) => Promise<AuctionInventoryWithDetailsRow | null>;
  searchAuctionItems: (
    input: AuctionInventorySearchInput,
  ) => Promise<AuctionInventorySearchRow[]>;
  getUnsoldInventories: () => Promise<InventoryRow[]>;
  updateAuctionItem: (data: UpdateAuctionInventoryInput, updated_by?: string) => Promise<void>;
  updateInventory: (
    inventory_id: string,
    data: CreateInventoryInput,
  ) => Promise<InventoryRow>;
  getAllInventories: (
    status?: InventoryStatus[],
  ) => Promise<InventoryRow[]>;
  getAllInventoriesForManifest: (
    status?: InventoryStatus[],
  ) => Promise<InventoryForManifestRow[]>;
  updateBulkInventoryStatus: (
    status: InventoryStatus,
    data: string[],
  ) => Promise<Prisma.BatchPayload>;
  getBoughtItems: (params: {
    year: string;
    month?: string;
    view?: string;
    branchId: string;
  }) => Promise<InventoryWithAuctionsInventoryRow[]>;
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
