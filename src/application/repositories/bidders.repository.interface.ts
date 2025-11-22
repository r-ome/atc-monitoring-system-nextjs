import type {
  BidderSchema,
  BidderInsertSchema,
} from "src/entities/models/Bidder";

export interface IBidderRepository {
  getBidder(bidder_number: string): Promise<BidderSchema>;
  getBidderByBidderNumber(
    bidder_number: string,
    branch_id: string
  ): Promise<BidderSchema | null>;
  getBidders(
    branch_ids: string[]
  ): Promise<Omit<BidderSchema, "auctions_joined" | "requirements">[]>;
  createBidder(
    bidder: BidderInsertSchema,
    branch_ids: string[]
  ): Promise<Omit<BidderSchema, "auctions_joined" | "requirements">>;
  updateBidder(
    bidder_id: string,
    data: BidderInsertSchema
  ): Promise<Omit<BidderSchema, "auctions_joined" | "requirements">>;
}
