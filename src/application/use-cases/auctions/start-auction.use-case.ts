import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const startAuctionUseCase = async (auction_date: Date) => {
  return await AuctionRepository.startAuction(auction_date);
};
