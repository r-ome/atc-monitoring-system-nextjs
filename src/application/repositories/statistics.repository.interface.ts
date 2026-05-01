import {
  AuctionBidderWithBidderInventoriesRow,
  BiddersWithBirthdatesAndRecentAuctionSchema,
} from "src/entities/models/Bidder";
import { ContainerWithBranchRow } from "src/entities/models/Container";
import {
  AuctionsStatisticsRow,
  UnpaidBidderBranchBalanceRow,
} from "src/entities/models/Statistics";
import { BannedBidderRow } from "src/entities/models/BidderBanHistory";

export interface IStatisticsRepository {
  getBidderBirthdates: () => Promise<
    BiddersWithBirthdatesAndRecentAuctionSchema[]
  >;
  getContainersDueDate: () => Promise<ContainerWithBranchRow[]>;
  getUnpaidBidders: () => Promise<AuctionBidderWithBidderInventoriesRow[]>;
  getUnpaidBidderBalanceSummary: () => Promise<
    UnpaidBidderBranchBalanceRow[]
  >;
  getAuctionsStatistics: () => Promise<AuctionsStatisticsRow[]>;
  getBannedBidders: () => Promise<BannedBidderRow[]>;
}
