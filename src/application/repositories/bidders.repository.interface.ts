import type {
  BidderSchema,
  BidderInsertSchema,
} from "src/entities/models/Bidder";

export interface IBidderRepository {
  getBidder(bidder_number: string): Promise<BidderSchema>;
  getBidderByBidderNumber(
    bidder_number: string,
    branch_name: string
  ): Promise<BidderSchema | null>;
  getBidders(): Promise<
    Omit<BidderSchema, "auctions_joined" | "requirements">[]
  >;
  createBidder(
    bidder: BidderInsertSchema
  ): Promise<Omit<BidderSchema, "auctions_joined" | "requirements">>;
  updateBidder(
    bidder_id: string,
    data: BidderInsertSchema
  ): Promise<Omit<BidderSchema, "auctions_joined" | "requirements">>;
}
