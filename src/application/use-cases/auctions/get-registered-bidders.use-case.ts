import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const getRegisteredBiddersUseCase = async (auction_id: string) => {
  return await AuctionRepository.getRegisteredBidders(auction_id);
};
