import { BranchRepository } from "src/infrastructure/di/repositories";
import { type CreateBranchInput } from "src/entities/models/Branch";
import { InputParseError, NotFoundError } from "src/entities/errors/common";

export const updateBranchUseCase = async (
  branch_id: string,
  input: CreateBranchInput,
) => {
  const branch = await BranchRepository.getBranch(branch_id);
  if (!branch) throw new NotFoundError("Branch not found!");

  const existing = await BranchRepository.getBranchByName(input.name);
  if (existing && existing.branch_id !== branch_id) {
    throw new InputParseError("Invalid Data!", {
      cause: {
        name: [`Branch Name - ${input.name} already taken!`],
      },
    });
  }

  return BranchRepository.updateBranch(branch_id, input);
};
