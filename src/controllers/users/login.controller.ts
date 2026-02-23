import {
  UserWithBranchRow,
  loginUserSchema,
  LoginUserInput,
} from "src/entities/models/User";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { loginUseCase } from "src/application/use-cases/users/login.use-case";
import { logger } from "@/app/lib/logger";

function presenter(user: UserWithBranchRow) {
  return user;
}

export const LoginController = async (
  credentials: Partial<LoginUserInput>,
) => {
  try {
    const { data, error: inputParserror } =
      loginUserSchema.safeParse(credentials);

    if (inputParserror) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParserror.flatten().fieldErrors,
      });
    }

    const user = await loginUseCase(data.username, data.password);
    return ok(presenter(user));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("LoginController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("LoginController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
