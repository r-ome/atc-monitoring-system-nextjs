import { UserRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { UserWithBranchRow } from "src/entities/models/User";
import { logger } from "@/app/lib/logger";
import { userPresenter } from "./user.presenter";

function presenter(users: UserWithBranchRow[]) {
  return users
    .filter((item) => !["SUPER_ADMIN", "OWNER"].includes(item.role))
    .map(userPresenter);
}

export const GetUsersController = async () => {
  try {
    const users = await UserRepository.getUsers();
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
