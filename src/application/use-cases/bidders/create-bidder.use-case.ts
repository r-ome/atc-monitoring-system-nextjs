import { BidderInsertSchema } from "src/entities/models/Bidder";
import { BidderRepository } from "src/infrastructure/repositories/bidders.repository";
import { formatNumberPadding } from "@/app/lib/utils";

export const createBidderUseCase = async (
  bidder: BidderInsertSchema,
  branch_ids: string[]
) => {
  bidder.bidder_number = formatNumberPadding(bidder.bidder_number, 4);
  return await BidderRepository.createBidder(bidder, branch_ids);
};
