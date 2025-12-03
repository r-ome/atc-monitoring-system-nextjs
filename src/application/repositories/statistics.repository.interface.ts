import { BiddersWithBirthdatesAndRecentAuctionSchema } from "src/entities/models/Bidder";

export interface IStatisticsRepository {
  getBidderBirthdates: () => Promise<
    BiddersWithBirthdatesAndRecentAuctionSchema[]
  >;
}
