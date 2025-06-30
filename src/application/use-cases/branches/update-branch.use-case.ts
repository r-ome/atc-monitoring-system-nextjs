import { BranchRepository } from "src/infrastructure/repositories/branch.repository";
import { type BranchInsertSchema } from "src/entities/models/Branch";
import { InputParseError, NotFoundError } from "src/entities/errors/common";
import { getBranchUseCase } from "./get-branch.use-case";

export const updateBranchUseCase = async (
  branch_id: string,
  input: BranchInsertSchema
) => {
  const branch = await getBranchUseCase(branch_id);

  if (!branch) {
    throw new NotFoundError("Branch not found!");
  }

  if (branch.branch_id === branch_id) {
    if (input.name === branch.name)
      throw new InputParseError("Invalid Data!", {
        cause: {
          name: ["Branch Name already taken!"],
        },
      });
  }

  return BranchRepository.updateBranch(branch_id, input);
};
