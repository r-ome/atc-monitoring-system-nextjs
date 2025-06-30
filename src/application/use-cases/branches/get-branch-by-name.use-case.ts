import { BranchRepository } from "src/infrastructure/repositories/branch.repository";

export const getBranchByNameUseCase = async (name: string) => {
  return await BranchRepository.getBranchByName(name);
};
