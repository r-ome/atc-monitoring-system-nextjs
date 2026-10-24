import { Prisma } from "@prisma/client";
import type { BidderActivityRecalculation } from "src/entities/models/BidderActivity";
import type {
  BidderWithBranchRow,
  BidderWithDetailsRow,
  BidderWithDetailsAndReceiptsRow,
  BidderListRow,
  CreateBidderInput,
  UpdateBidderInput,
  CreateBidderBulkInput,
} from "src/entities/models/Bidder";

export interface IBidderRepository {
  getBidder(bidder_id: string): Promise<BidderWithDetailsRow>;
  getBidderByBidderNumber(
    bidder_number: string,
    branch_name: string,
  ): Promise<BidderWithDetailsAndReceiptsRow | null>;
  getBidders(): Promise<BidderListRow[]>;
  recalculateActivity(branch_id: string): Promise<BidderActivityRecalculation>;
  createBidder(bidder: CreateBidderInput): Promise<BidderWithBranchRow>;
  updateBidder(
    bidder_id: string,
    data: UpdateBidderInput,
  ): Promise<BidderWithBranchRow>;
  updateBidderStatus(
    bidder_id: string,
    status: UpdateBidderInput["status"],
  ): Promise<BidderWithBranchRow>;
  uploadBidders(data: CreateBidderBulkInput[]): Promise<Prisma.BatchPayload>;
}
