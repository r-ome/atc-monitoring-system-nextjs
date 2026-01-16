import { Prisma } from "@prisma/client";
import type {
  BidderSchema,
  BidderInsertSchema,
  BulkBidderInsertSchema,
} from "src/entities/models/Bidder";

export interface IBidderRepository {
  getBidder(bidder_number: string): Promise<BidderSchema>;
  getBidderByBidderNumber(
    bidder_number: string,
    branch_name: string
  ): Promise<BidderSchema | null>;
  getBidders(): Promise<
    (Omit<BidderSchema, "requirements" | "auctions_joined"> & {
      auctions_joined: Array<
        Omit<BidderSchema["auctions_joined"][number], "auctions_inventories">
      >;
    })[]
  >;
  createBidder(
    bidder: BidderInsertSchema
  ): Promise<Omit<BidderSchema, "auctions_joined" | "requirements">>;
  updateBidder(
    bidder_id: string,
    data: BidderInsertSchema
  ): Promise<Omit<BidderSchema, "auctions_joined" | "requirements">>;
  uploadBidders(data: BulkBidderInsertSchema[]): Promise<Prisma.BatchPayload>;
}
