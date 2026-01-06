import {
  UnpaidAuctionsBiddersSchema,
  BiddersWithBirthdatesAndRecentAuctionSchema,
} from "src/entities/models/Bidder";
import { ContainerSchema } from "src/entities/models/Container";
import { AuctionsStatisticsSchema } from "src/entities/models/Statistics";

export interface IStatisticsRepository {
  getBidderBirthdates: () => Promise<
    BiddersWithBirthdatesAndRecentAuctionSchema[]
  >;
  getContainersDueDate: () => Promise<
    Omit<ContainerSchema, "supplier" | "inventories">[]
  >;
  getUnpaidBidders: () => Promise<UnpaidAuctionsBiddersSchema[]>;
  getAuctionsStatistics: () => Promise<AuctionsStatisticsSchema[]>;
}
