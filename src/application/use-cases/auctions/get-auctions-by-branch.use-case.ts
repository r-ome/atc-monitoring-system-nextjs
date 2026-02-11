import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const getAuctionsByBranchUseCase = async (branch_id: string) => {
  return await AuctionRepository.getAuctionsByBranch(branch_id);
};
