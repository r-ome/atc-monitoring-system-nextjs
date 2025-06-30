import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Response";
import { RegisterUserInputSchema, UserSchema } from "src/entities/models/User";
import { registerUserUseCase } from "src/application/use-cases/users/register-user.use-case";

function presenter(user: UserSchema) {
  return user;
}

export const RegisterUserController = async (
  input: Partial<RegisterUserInputSchema>
) => {
  try {
    const { data, error: inputParseError } =
      RegisterUserInputSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const created = await registerUserUseCase(data);
    return ok(presenter(created));
  } catch (error) {
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
