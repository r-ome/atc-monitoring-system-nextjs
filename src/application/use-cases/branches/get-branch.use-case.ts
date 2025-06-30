import { BranchRepository } from "src/infrastructure/repositories/branch.repository";

export const getBranchUseCase = async (branch_id: string) => {
  return await BranchRepository.getBranch(branch_id);
};
