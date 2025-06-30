import { AuctionDateRange } from "src/entities/models/Auction";
import { NotFoundError } from "src/entities/errors/common";
import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const getAuctionUseCase = async (
  auction_date: Date | AuctionDateRange
) => {
  const auction = await AuctionRepository.getAuction(auction_date);
  if (!auction) {
    throw new NotFoundError(`Auction not yet created`);
  }
  return auction;
};
