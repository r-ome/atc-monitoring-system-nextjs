import { CreateBranchInput } from "src/entities/models/Branch";
import { BranchRepository } from "src/infrastructure/di/repositories";
import { InputParseError } from "src/entities/errors/common";

export const createBranchUseCase = async (branch: CreateBranchInput) => {
  const exists = await BranchRepository.getBranchByName(branch.name);

  if (exists) {
    throw new InputParseError("Invalid Data!", {
      cause: { name: ["Name already exists!"] },
    });
  }

  return await BranchRepository.createBranch(branch);
};
