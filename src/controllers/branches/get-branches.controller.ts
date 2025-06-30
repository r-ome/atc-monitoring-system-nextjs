import { getBranchesUseCase } from "src/application/use-cases/branches/get-branches.use-case";
import { BranchSchema } from "src/entities/models/Branch";
import { format } from "date-fns";
import { ok, err } from "src/entities/models/Response";
import { DatabaseOperationError } from "src/entities/errors/common";

const presenter = (branches: BranchSchema[]) => {
  const date_format = "MMM dd, yyyy";
  return branches.map((branch) => ({
    ...branch,
    created_at: format(branch.created_at, date_format),
    updated_at: format(branch.updated_at, date_format),
    deleted_at: branch.deleted_at
      ? format(branch.deleted_at, date_format)
      : null,
  }));
};

export const GetBranchesController = async () => {
  try {
    const branches = await getBranchesUseCase();
    return ok(presenter(branches));
  } catch (error) {
    if (error instanceof DatabaseOperationError) {
      return err({
        message: "Server Error",
        cause: error.message,
      });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
