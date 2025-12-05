import { getUsersUseCase } from "src/application/use-cases/users/get-users.use-case";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Response";
import { UserSchema } from "src/entities/models/User";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

function presenter(users: UserSchema[]) {
  return users
    .filter((item) => !["SUPER_ADMIN", "OWNER"].includes(item.role))
    .map((user) => ({
      user_id: user.user_id,
      name: user.name,
      username: user.username,
      role: user.role,
      branch: {
        branch_id: user.branch_id,
        name: user.branch?.name,
      },
      created_at: formatDate(user.created_at, "MMMM dd, yyyy"),
      updated_at: formatDate(user.updated_at, "MMMM dd, yyyy"),
    }));
}

export const GetUsersController = async () => {
  try {
    const users = await getUsersUseCase();
    return ok(presenter(users));
  } catch (error) {
    logger("GetUsersController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
