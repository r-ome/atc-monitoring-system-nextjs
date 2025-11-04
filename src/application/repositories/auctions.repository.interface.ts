import { Prisma } from "@prisma/client";
import {
  AUCTION_ITEM_STATUS,
  AuctionDateRange,
  AuctionSchema,
  AuctionsInventorySchema,
} from "src/entities/models/Auction";
import {
  RegisterBidderInputSchema,
  RegisteredBidderSchema,
} from "src/entities/models/Bidder";
import {
  CounterCheckInsertSchema,
  CounterCheckSchema,
  CounterCheckUpdateSchema,
} from "src/entities/models/CounterCheck";
import {
  ManifestInsertSchema,
  ManifestSchema,
  ManifestUpdateSchema,
} from "src/entities/models/Manifest";
import { CancelItemsSchema } from "src/entities/models/Inventory";

export interface IAuctionRepository {
  getAuctionById: (auction_id: string) => Promise<AuctionSchema | null>;
  getAuction: (
    auction_date: Date | AuctionDateRange
  ) => Promise<AuctionSchema | null>;
  startAuction: (auction_date: Date) => Promise<AuctionSchema>;
  registerBidder: (
    data: RegisterBidderInputSchema
  ) => Promise<Omit<RegisteredBidderSchema, "auctions_inventories" | "bidder">>;
  getRegisteredBidders: (
    auction_id: string
  ) => Promise<RegisteredBidderSchema[]>;
  getRegisteredBidder: (
    bidder_number: string,
    auction_id: string
  ) => Promise<RegisteredBidderSchema | null>;
  getMonitoring: (
    auction_id: string,
    status: AUCTION_ITEM_STATUS[]
  ) => Promise<AuctionsInventorySchema[]>;
  uploadManifest: (
    auction_id: string,
    data: ManifestInsertSchema[],
    is_bought_items: boolean
  ) => Promise<
    Omit<
      AuctionsInventorySchema,
      "auction_bidder" | "inventory" | "histories" | "receipt"
    >[]
  >;
  uploadCounterCheck: (
    auction_id: string,
    data: CounterCheckInsertSchema[]
  ) => Promise<Prisma.BatchPayload>;
  getManifestRecords: (auction_id: string) => Promise<ManifestSchema[]>;
  cancelItems: (data: CancelItemsSchema) => Promise<void>;
  getBiddersWithBalance: () => Promise<
    (Omit<RegisteredBidderSchema, "auctions_inventories"> & {
      auctions_inventories: Omit<
        AuctionsInventorySchema,
        "auction_bidder" | "receipt" | "histories"
      >[];
    })[]
  >;
  getCounterCheckRecords: (auction_id: string) => Promise<CounterCheckSchema[]>;
  updateCounterCheck: (
    counter_check_id: string,
    data: CounterCheckUpdateSchema
  ) => Promise<CounterCheckSchema>;
  updateManifest: (
    manifest_id: string,
    data: ManifestUpdateSchema[],
    original: ManifestUpdateSchema
  ) => Promise<ManifestSchema>;
}
