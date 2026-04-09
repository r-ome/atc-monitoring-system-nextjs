import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import {
  updateUserSchema,
  UpdateUserInput,
} from "src/entities/models/User";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { buildActivityLogDiff } from "@/app/lib/activity-log-diff";
import { UserRepository } from "src/infrastructure/di/repositories";
import { userPresenter } from "./user.presenter";

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

    const previous = await UserRepository.getUserById(user_id);
    const updated = await UserRepository.updateUser(user_id, data);
    const diffDescription = previous
      ? buildActivityLogDiff({
          previous,
          current: updated,
          fields: [
            { label: "Name", getValue: (user) => user.name },
            { label: "Username", getValue: (user) => user.username },
            { label: "Role", getValue: (user) => user.role },
            { label: "Branch", getValue: (user) => user.branch.name },
          ],
        })
      : "";
    const description = diffDescription
      ? `Updated user ${updated.username} | ${diffDescription}`
      : `Updated user ${updated.username}`;
    await logActivity("UPDATE", "user", user_id, description);
    return ok(userPresenter(updated));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateUserController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
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
