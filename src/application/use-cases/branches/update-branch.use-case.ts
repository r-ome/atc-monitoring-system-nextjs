import { BranchRepository } from "src/infrastructure/repositories/branch.repository";
import { type CreateBranchInput } from "src/entities/models/Branch";
import { InputParseError, NotFoundError } from "src/entities/errors/common";
import { getBranchUseCase } from "./get-branch.use-case";
import { getBranchByNameUseCase } from "./get-branch-by-name.use-case";

export const updateBranchUseCase = async (
  branch_id: string,
  input: CreateBranchInput,
) => {
  const branch = await getBranchUseCase(branch_id);
  if (!branch) throw new NotFoundError("Branch not found!");

  const existing = await getBranchByNameUseCase(input.name);
  if (existing && existing.branch_id !== branch_id) {
    throw new InputParseError("Invalid Data!", {
      cause: {
        name: [`Branch Name - ${input.name} already taken!`],
      },
    });
  }

  return BranchRepository.updateBranch(branch_id, input);
};
