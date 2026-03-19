import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { updateBranchSchema } from "src/entities/models/Branch";
import { updateBranchUseCase } from "src/application/use-cases/branches/update-branch.use-case";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { presentBranch } from "./create-branch.controller";

export const UpdateBranchController = async (
  branch_id: string,
  input: Record<string, unknown>,
) => {
  try {
    const { data, error: inputParseError } =
      updateBranchSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const updated = await updateBranchUseCase(branch_id, data);
    return ok(presentBranch(updated));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateBranchController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UpdateBranchController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateBranchController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
