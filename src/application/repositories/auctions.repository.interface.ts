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
import { ManifestSchema } from "src/entities/models/Manifest";
import { CancelItemsSchema } from "src/entities/models/Inventory";

export interface IAuctionRepository {
  getAuction: (
    auction_date: Date | AuctionDateRange
  ) => Promise<AuctionSchema | null>;
  startAuction: (auction_date: Date) => Promise<AuctionSchema>;
  registerBidder: (data: RegisterBidderInputSchema) => Promise<any>;
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
    data: any
  ) => Promise<
    Omit<
      AuctionsInventorySchema,
      "auction_bidder" | "inventory" | "histories" | "receipt"
    >[]
  >;
  getManifestRecords: (auction_id: string) => Promise<ManifestSchema[]>;
  cancelItems: (data: CancelItemsSchema) => Promise<any>;
  getBiddersWithBalance: () => Promise<
    (Omit<RegisteredBidderSchema, "auctions_inventories"> & {
      auctions_inventories: Omit<
        AuctionsInventorySchema,
        "auction_bidder" | "receipt" | "histories"
      >[];
    })[]
  >;
}
