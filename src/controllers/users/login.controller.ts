import {
  UserSchema,
  LoginUserSchema,
  type LoginUserSchema as LoginUserSchemaType,
} from "src/entities/models/User";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { loginUseCase } from "src/application/use-cases/users/login.use-case";
import { logger } from "@/app/lib/logger";

function presenter(user: UserSchema) {
  return user;
}

export const LoginController = async (
  credentials: Partial<LoginUserSchemaType>,
) => {
  try {
    const { data, error: inputParserror } =
      LoginUserSchema.safeParse(credentials);

    if (inputParserror) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParserror.flatten().fieldErrors,
      });
    }

    const user = await loginUseCase(data.username, data.password);
    return ok(presenter(user));
  } catch (error) {
    logger("LoginController", error);
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
