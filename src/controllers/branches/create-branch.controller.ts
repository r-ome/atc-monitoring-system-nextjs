import { BranchSchema, BranchInsertSchema } from "src/entities/models/Branch";
import { createBranchUseCase } from "src/application/use-cases/branches/create-branch.use-case";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { formatDate } from "@/app/lib/utils";
import { err, ok } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";

const presenter = (branch: BranchSchema) => {
  const date_format = "MMM dd, yyyy";
  return {
    ...branch,
    created_at: formatDate(branch.created_at, date_format),
    updated_at: formatDate(branch.updated_at, date_format),
    deleted_at: branch.deleted_at
      ? formatDate(branch.deleted_at, date_format)
      : null,
  };
};

export const CreateBranchController = async (
  input: Partial<BranchInsertSchema>
) => {
  try {
    const { data, error: inputParseError } =
      BranchInsertSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const branch = await createBranchUseCase(data);
    return ok(presenter(branch));
  } catch (error) {
    logger("CreateBranchController", error);
    if (error instanceof InputParseError) {
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
