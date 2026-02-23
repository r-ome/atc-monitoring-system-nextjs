import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import {
  updateUserPasswordSchema,
  UpdateUserPasswordInput,
  UserWithBranchRow,
} from "src/entities/models/User";
import { logger } from "@/app/lib/logger";
import { updateUserPasswordUseCase } from "src/application/use-cases/users/update-user-password.use-case";

function presenter(user: UserWithBranchRow) {
  return user;
}

export const UpdateUserPasswordController = async (
  user_id: string,
  input: Partial<UpdateUserPasswordInput>,
) => {
  try {
    const { data, error: inputParseError } =
      updateUserPasswordSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const created = await updateUserPasswordUseCase(user_id, data);
    return ok(presenter(created));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateUserPasswordController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateUserPasswordController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
