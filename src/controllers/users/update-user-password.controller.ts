import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import {
  updateUserPasswordSchema,
  UpdateUserPasswordInput,
} from "src/entities/models/User";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { updateUserPasswordUseCase } from "src/application/use-cases/users/update-user-password.use-case";
import { userPresenter } from "./user.presenter";

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
    await logActivity(
      "UPDATE",
      "user",
      user_id,
      `Password updated for user ${created.username}`,
    );
    return ok(userPresenter(created));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateUserPasswordController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
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
