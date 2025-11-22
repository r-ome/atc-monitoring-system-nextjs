import { BidderRepository } from "src/infrastructure/repositories/bidders.repository";

export const getBiddersUseCase = async (branch_ids: string[]) => {
  return await BidderRepository.getBidders(branch_ids);
};
