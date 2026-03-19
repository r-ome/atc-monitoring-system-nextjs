import {
  createBranchSchema,
  BranchRow,
} from "src/entities/models/Branch";
import { createBranchUseCase } from "src/application/use-cases/branches/create-branch.use-case";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { formatDate } from "@/app/lib/utils";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

const DATE_FORMAT = "MMM dd, yyyy hh:mm a";

export const presentBranch = (branch: BranchRow) => {
  return {
    ...branch,
    created_at: formatDate(branch.created_at, DATE_FORMAT),
    updated_at: formatDate(branch.updated_at, DATE_FORMAT),
    deleted_at: branch.deleted_at
      ? formatDate(branch.deleted_at, DATE_FORMAT)
      : null,
  };
};

export const CreateBranchController = async (input: Record<string, unknown>) => {
  try {
    const { data, error: inputParseError } =
      createBranchSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const branch = await createBranchUseCase(data);
    return ok(presentBranch(branch));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("CreateBranchController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("CreateBranchController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
