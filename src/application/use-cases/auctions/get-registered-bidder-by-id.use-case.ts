import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const getRegisteredBidderById = async (auction_bidder_id: string) => {
  return await AuctionRepository.getRegisteredBidderById(auction_bidder_id);
};
