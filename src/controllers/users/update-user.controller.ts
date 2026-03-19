import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import {
  updateUserSchema,
  UpdateUserInput,
  UserWithBranchRow,
} from "src/entities/models/User";
import { logger } from "@/app/lib/logger";
import { UserRepository } from "src/infrastructure/di/repositories";

function presenter(user: UserWithBranchRow) {
  return user;
}

export const UpdateUserController = async (
  user_id: string,
  input: Partial<UpdateUserInput>,
) => {
  try {
    const { data, error: inputParseError } =
      updateUserSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const created = await UserRepository.updateUser(user_id, data);
    return ok(presenter(created));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateUserController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateUserController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
