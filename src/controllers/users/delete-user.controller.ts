import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { UserRepository } from "src/infrastructure/di/repositories";

export const DeleteUserController = async (user_id: string) => {
  try {
    const ctx = RequestContext.getStore();
    const deleted = await UserRepository.deleteUser(user_id);

    logger("DeleteUserController", {
      user_id,
      username: ctx?.username,
      branch_name: ctx?.branch_name,
    }, "info");

    await logActivity(
      "DELETE",
      "user",
      deleted.user_id,
      `Deleted user ${deleted.username} (${deleted.role})`,
    );

    return ok({ user_id: deleted.user_id, username: deleted.username });
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger("DeleteUserController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("DeleteUserController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
