import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const getBiddersWithBalanceUseCase = async () => {
  return await AuctionRepository.getBiddersWithBalance();
};
