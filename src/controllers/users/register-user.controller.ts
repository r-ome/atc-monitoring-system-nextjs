import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import {
  registerUserSchema,
  RegisterUserInput,
  UserWithBranchRow,
} from "src/entities/models/User";
import { registerUserUseCase } from "src/application/use-cases/users/register-user.use-case";
import { logger } from "@/app/lib/logger";

function presenter(user: UserWithBranchRow) {
  return user;
}

export const RegisterUserController = async (
  input: Partial<RegisterUserInput>,
) => {
  try {
    const { data, error: inputParseError } =
      registerUserSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const created = await registerUserUseCase(data);
    return ok(presenter(created));
  } catch (error) {
    logger("RegisterUserController", error);
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
