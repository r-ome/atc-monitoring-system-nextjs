import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  BranchInsertSchema,
  BranchSchema,
  type BranchInsertSchema as BranchInsertSchemaType,
} from "src/entities/models/Branch";
import { updateBranchUseCase } from "src/application/use-cases/branches/update-branch.use-case";
import { err, ok } from "src/entities/models/Response";

function presenter(branch: BranchSchema) {
  return branch;
}

export const UpdateBranchController = async (
  branch_id: string,
  input: Partial<BranchInsertSchemaType>
) => {
  try {
    const { data, error: inputParseError } =
      BranchInsertSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const updated = await updateBranchUseCase(branch_id, data);
    return ok(presenter(updated));
  } catch (error) {
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
