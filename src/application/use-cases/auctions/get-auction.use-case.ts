import { AuctionDateRange } from "src/entities/models/Auction";
import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const getAuctionUseCase = async (
  auction_date: Date | AuctionDateRange,
  branch_ids: string[]
) => {
  return await AuctionRepository.getAuction(auction_date, branch_ids);
};
