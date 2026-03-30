import { Prisma } from "@prisma/client";
import {
  AuctionItemStatus,
  AuctionDateRange,
  AuctionWithDetailsRow,
  AuctionInventoryWithDetailsRow,
  AuctionInventoryWithHistoriesRow,
  AuctionWithBranchBiddersRow,
} from "src/entities/models/Auction";
import {
  RegisterBidderInput,
  AuctionBidderWithFullDetailsRow,
  AuctionBidderForManifestRow,
  RegisteredBidderSummaryRow,
  UpdateBidderRegistrationInput,
  AuctionBidderRow,
  AuctionBidderWithInventoriesRow,
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
  getAuctionId: (
    auction_date: Date,
  ) => Promise<{ auction_id: string } | null>;
  startAuction: (auction_date: Date) => Promise<AuctionWithDetailsRow>;
  registerBidder: (
    data: RegisterBidderInput,
  ) => Promise<AuctionBidderRow>;
  getRegisteredBidders: (
    auction_id: string,
  ) => Promise<AuctionBidderWithFullDetailsRow[]>;
  getRegisteredBiddersForManifest: (
    auction_id: string,
  ) => Promise<AuctionBidderForManifestRow[]>;
  getRegisteredBiddersSummary: (
    auction_id: string,
  ) => Promise<RegisteredBidderSummaryRow[]>;
  getRegisteredBidder: (
    bidder_number: string,
    auction_id: string,
  ) => Promise<AuctionBidderWithFullDetailsRow | null>;
  getRegisteredBidderById: (
    auction_bidder_id: string,
  ) => Promise<AuctionBidderWithFullDetailsRow | null>;
  getMonitoring: (
    auction_id: string,
    status: AuctionItemStatus[],
  ) => Promise<AuctionInventoryWithDetailsRow[]>;
  uploadManifest: (
    auction_id: string,
    data: UploadManifestInput[],
    is_bought_items: boolean,
    uploaded_by?: string,
  ) => Promise<AuctionInventoryWithHistoriesRow[]>;
  uploadCounterCheck: (
    auction_id: string,
    data: UploadCounterCheckInput[],
  ) => Promise<Prisma.BatchPayload>;
  getManifestRecords: (auction_id: string) => Promise<ManifestRow[]>;
  cancelItems: (data: CancelItemsInput) => Promise<{ bidder_number: string; first_name: string; last_name: string }>;
  getBiddersWithBalance: () => Promise<AuctionBidderWithInventoriesRow[]>;
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
  ) => Promise<AuctionBidderRow>;
  unregisterBidder: (auction_bidder_id: string) => Promise<void>;
  getAuctionsByBranch: (branch_id: string) => Promise<AuctionWithBranchBiddersRow[]>;
}
