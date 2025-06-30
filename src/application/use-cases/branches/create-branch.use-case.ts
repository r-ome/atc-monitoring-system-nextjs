import { BranchInsertSchema, BranchSchema } from "src/entities/models/Branch";
import { BranchRepository } from "src/infrastructure/repositories/branch.repository";
import { getBranchByNameUseCase } from "./get-branch-by-name.use-case";
import { InputParseError } from "src/entities/errors/common";

export const createBranchUseCase = async (branch: BranchInsertSchema) => {
  const exists = await getBranchByNameUseCase(branch.name);

  if (exists) {
    throw new InputParseError("Invalid Data!", {
      cause: { name: ["Name already exists!"] },
    });
  }

  return await BranchRepository.createBranch(branch);
};
