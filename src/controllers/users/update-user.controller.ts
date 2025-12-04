import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Response";
import { UserUpdateInputSchema, UserSchema } from "src/entities/models/User";
import { logger } from "@/app/lib/logger";
import { updateUserUseCase } from "src/application/use-cases/users/update-user.use-case";

function presenter(user: UserSchema) {
  return user;
}

export const UpdateUserController = async (
  user_id: string,
  input: Partial<UserUpdateInputSchema>
) => {
  try {
    const { data, error: inputParseError } =
      UserUpdateInputSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const created = await updateUserUseCase(user_id, data);
    return ok(presenter(created));
  } catch (error) {
    logger("UpdateUserController", error);
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
