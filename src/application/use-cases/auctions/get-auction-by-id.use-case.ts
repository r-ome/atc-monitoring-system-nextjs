import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const getAuctionByIdUseCase = async (auction_id: string) => {
  return await AuctionRepository.getAuctionById(auction_id);
};
