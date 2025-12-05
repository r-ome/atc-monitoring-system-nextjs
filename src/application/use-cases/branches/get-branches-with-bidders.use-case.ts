import { BranchRepository } from "src/infrastructure/repositories/branch.repository";

export const getBranchWithBiddersUseCase = async (branch_id: string) => {
  return await BranchRepository.getBranchWithBidders(branch_id);
};
