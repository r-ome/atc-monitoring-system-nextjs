import { BranchSchema } from "src/entities/models/Branch";
import { BranchRepository } from "src/infrastructure/repositories/branch.repository";

export const getBranchesUseCase = async () => {
  return await BranchRepository.getBranches();
};
