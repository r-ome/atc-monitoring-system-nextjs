import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  BranchRow,
  createBranchSchema,
  CreateBranchInput,
} from "src/entities/models/Branch";
import { updateBranchUseCase } from "src/application/use-cases/branches/update-branch.use-case";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { formatDate } from "@/app/lib/utils";

function presenter(branch: BranchRow) {
  const date_format = "MMM dd, yyyy";
  return {
    ...branch,
    created_at: formatDate(branch.created_at, date_format),
    updated_at: formatDate(branch.updated_at, date_format),
    deleted_at: branch.deleted_at
      ? formatDate(branch.deleted_at, date_format)
      : null,
  };
}

export const UpdateBranchController = async (
  branch_id: string,
  input: Partial<CreateBranchInput>,
) => {
  try {
    const { data, error: inputParseError } =
      createBranchSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const updated = await updateBranchUseCase(branch_id, data);
    return ok(presenter(updated));
  } catch (error) {
    logger("UpdateBranchController", error);
    if (error instanceof InputParseError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error.cause });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
