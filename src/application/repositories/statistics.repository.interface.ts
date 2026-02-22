import {
  UnpaidAuctionsBiddersSchema,
  BiddersWithBirthdatesAndRecentAuctionSchema,
} from "src/entities/models/Bidder";
import { ContainerWithBranchRow } from "src/entities/models/Container";
import { AuctionsStatisticsRow } from "src/entities/models/Statistics";

export interface IStatisticsRepository {
  getBidderBirthdates: () => Promise<
    BiddersWithBirthdatesAndRecentAuctionSchema[]
  >;
  getContainersDueDate: () => Promise<ContainerWithBranchRow[]>;
  getUnpaidBidders: () => Promise<UnpaidAuctionsBiddersSchema[]>;
  getAuctionsStatistics: () => Promise<AuctionsStatisticsRow[]>;
}
