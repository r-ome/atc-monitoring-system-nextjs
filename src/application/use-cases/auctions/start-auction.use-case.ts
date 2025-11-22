import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const startAuctionUseCase = async (
  auction_date: Date,
  branch_id: string
) => {
  return await AuctionRepository.startAuction(auction_date, branch_id);
};
