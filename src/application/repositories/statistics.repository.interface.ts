import {
  BidderSchema,
  UnpaidAuctionsBiddersSchema,
  BiddersWithBirthdatesAndRecentAuctionSchema,
} from "src/entities/models/Bidder";
import { ContainerSchema } from "src/entities/models/Container";

export interface IStatisticsRepository {
  getBidderBirthdates: () => Promise<
    BiddersWithBirthdatesAndRecentAuctionSchema[]
  >;
  getContainersDueDate: () => Promise<
    Omit<ContainerSchema, "branch" | "supplier" | "inventories">[]
  >;
  getUnpaidBidders: () => Promise<UnpaidAuctionsBiddersSchema[]>;
}
