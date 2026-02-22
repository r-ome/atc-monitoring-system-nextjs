import { Prisma } from "@prisma/client";
import {
  AuctionItemStatus,
  AuctionDateRange,
  AuctionWithDetailsRow,
  AuctionInventoryWithDetailsRow,
} from "src/entities/models/Auction";
import {
  RegisterBidderInput,
  RegisteredBidderSchema,
  UpdateBidderRegistrationInput,
} from "src/entities/models/Bidder";
import {
  CounterCheckRow,
  UploadCounterCheckInput,
  UpdateCounterCheckInput,
} from "src/entities/models/CounterCheck";
import {
  ManifestRow,
  UploadManifestInput,
  UpdateManifestInput,
} from "src/entities/models/Manifest";
import { CancelItemsInput } from "src/entities/models/Inventory";

export interface IAuctionRepository {
  getAuctionById: (auction_id: string) => Promise<AuctionWithDetailsRow | null>;
  getAuction: (
    auction_date: Date | AuctionDateRange,
  ) => Promise<AuctionWithDetailsRow | null>;
  startAuction: (auction_date: Date) => Promise<AuctionWithDetailsRow>;
  registerBidder: (
    data: RegisterBidderInput,
  ) => Promise<Omit<RegisteredBidderSchema, "auctions_inventories" | "bidder">>;
  getRegisteredBidders: (
    auction_id: string,
  ) => Promise<RegisteredBidderSchema[]>;
  getRegisteredBidder: (
    bidder_number: string,
    auction_id: string,
  ) => Promise<RegisteredBidderSchema | null>;
  getRegisteredBidderById: (
    auction_bidder_id: string,
  ) => Promise<RegisteredBidderSchema | null>;
  getMonitoring: (
    auction_id: string,
    status: AuctionItemStatus[],
  ) => Promise<AuctionInventoryWithDetailsRow[]>;
  uploadManifest: (
    auction_id: string,
    data: UploadManifestInput[],
    is_bought_items: boolean,
  ) => Promise<
    Omit<
      AuctionInventoryWithDetailsRow,
      "auction_bidder" | "inventory" | "histories" | "receipt"
    >[]
  >;
  uploadCounterCheck: (
    auction_id: string,
    data: UploadCounterCheckInput[],
  ) => Promise<Prisma.BatchPayload>;
  getManifestRecords: (auction_id: string) => Promise<ManifestRow[]>;
  cancelItems: (data: CancelItemsInput) => Promise<void>;
  getBiddersWithBalance: () => Promise<
    (Omit<RegisteredBidderSchema, "auctions_inventories"> & {
      auctions_inventories: Omit<
        AuctionInventoryWithDetailsRow,
        "auction_bidder" | "receipt" | "histories"
      >[];
    })[]
  >;
  getCounterCheckRecords: (auction_id: string) => Promise<CounterCheckRow[]>;
  updateCounterCheck: (
    counter_check_id: string,
    data: UpdateCounterCheckInput,
  ) => Promise<CounterCheckRow>;
  updateManifest: (
    manifest_id: string,
    data: UpdateManifestInput[],
    original: UpdateManifestInput,
  ) => Promise<ManifestRow>;
  updateBidderRegistration: (
    auction_bidder_id: string,
    data: UpdateBidderRegistrationInput,
  ) => Promise<Omit<RegisteredBidderSchema, "auctions_inventories" | "bidder">>;
  unregisterBidder: (auction_bidder_id: string) => Promise<void>;
  getAuctionsByBranch: (branch_id: string) => Promise<
    Prisma.auctionsGetPayload<{
      include: { registered_bidders: { include: { bidder: true } } };
    }>[]
  >;
}
