import { Prisma } from "@prisma/client";
import type {
  BidderWithBranchRow,
  BidderWithDetailsRow,
  BidderWithLastAuctionRow,
  CreateBidderInput,
  CreateBidderBulkInput,
} from "src/entities/models/Bidder";

export interface IBidderRepository {
  getBidder(bidder_id: string): Promise<BidderWithDetailsRow>;
  getBidderByBidderNumber(
    bidder_number: string,
    branch_name: string,
  ): Promise<BidderWithDetailsRow | null>;
  getBidders(): Promise<BidderWithLastAuctionRow[]>;
  createBidder(bidder: CreateBidderInput): Promise<BidderWithBranchRow>;
  updateBidder(
    bidder_id: string,
    data: CreateBidderInput,
  ): Promise<BidderWithBranchRow>;
  uploadBidders(data: CreateBidderBulkInput[]): Promise<Prisma.BatchPayload>;
}
