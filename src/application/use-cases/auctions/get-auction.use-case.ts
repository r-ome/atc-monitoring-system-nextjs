import { AuctionDateRange } from "src/entities/models/Auction";
import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const getAuctionUseCase = async (
  auction_date: Date | AuctionDateRange
) => {
  return await AuctionRepository.getAuction(auction_date);
};
