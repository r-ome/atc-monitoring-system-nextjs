import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { BranchSchema } from "src/entities/models/Branch";
import { format } from "date-fns";
import { getBranchByNameUseCase } from "src/application/use-cases/branches/get-branch-by-name.use-case";
import { err, ok } from "src/entities/models/Response";

const presenter = (branch: BranchSchema) => {
  const date_format = "MMM dd, yyyy";
  return {
    branch_id: branch.branch_id,
    name: branch.name,
    created_at: format(branch.created_at, date_format),
    updated_at: format(branch.updated_at, date_format),
    deleted_at: branch.deleted_at
      ? format(branch.deleted_at, date_format)
      : null,
  };
};

export const GetBranchByNameController = async (name: string) => {
  try {
    const branch = await getBranchByNameUseCase(name);

    if (!branch) {
      throw new NotFoundError("Branch not found!", {
        cause: `Branch ${name} not found!`,
      });
    }

    return ok(presenter(branch));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
