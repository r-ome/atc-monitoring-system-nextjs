import { BidderRepository } from "src/infrastructure/repositories/bidders.repository";

export const getBiddersUseCase = async () => {
  return await BidderRepository.getBidders();
};
