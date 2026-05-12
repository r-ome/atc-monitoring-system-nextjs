import { Prisma } from "@prisma/client";
import type {
  InventoryWithDetailsRow,
  InventoryWithAuctionsInventoryRow,
  InventoryRow,
  InventoryForManifestRow,
  UpdateAuctionInventoryInput,
  CreateInventoryInput,
  MergeInventoriesInput,
  MergeInventoriesResult,
  InventoryStatus,
} from "src/entities/models/Inventory";
import {
  AuctionInventorySearchParams,
  AuctionInventorySearchRow,
  AuctionInventoryWithContainerDetailsRow,
} from "src/entities/models/Auction";
import {
  ApplyFinalReportMatchesInput,
  ApplyFinalReportCounterCheckMatchesInput,
  CreateFinalReportAddOnsInput,
  ApplyFinalReportQtySplitInput,
  ApplyFinalReportVoidInput,
  ApplyFinalReportDirectBoughtInput,
} from "src/entities/models/FinalReport";

export interface IInventoryRepository {
  getInventory: (inventory_id: string) => Promise<InventoryWithDetailsRow>;
  getAuctionItemDetails: (
    auction_inventory_id: string,
  ) => Promise<AuctionInventoryWithContainerDetailsRow | null>;
  searchAuctionItems: (
    params: AuctionInventorySearchParams,
  ) => Promise<AuctionInventorySearchRow[]>;
  getUnsoldInventories: () => Promise<InventoryRow[]>;
  updateAuctionItem: (data: UpdateAuctionInventoryInput, updated_by?: string) => Promise<void>;
  resolveFinalReportMatches: (
    data: ApplyFinalReportMatchesInput,
    updated_by?: string,
  ) => Promise<void>;
  resolveFinalReportCounterCheckMatches: (
    data: ApplyFinalReportCounterCheckMatchesInput,
    updated_by?: string,
  ) => Promise<void>;
  createFinalReportAddOns: (
    data: CreateFinalReportAddOnsInput,
    updated_by?: string,
  ) => Promise<void>;
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
  mergeInventories: (
    data: MergeInventoriesInput,
  ) => Promise<MergeInventoriesResult>;
  applySplitBoughtItems: (
    data: ApplyFinalReportQtySplitInput,
    updated_by?: string,
  ) => Promise<void>;
  applyVoidInventory: (
    data: ApplyFinalReportVoidInput,
    updated_by?: string,
  ) => Promise<void>;
  applyDirectBoughtItem: (
    data: ApplyFinalReportDirectBoughtInput,
    updated_by?: string,
  ) => Promise<void>;
  appendInventories: (
    data: { barcode: string; inventory_id: string }[],
  ) => Promise<void>;
  deleteInventory: (inventory_id: string) => Promise<void>;
}
