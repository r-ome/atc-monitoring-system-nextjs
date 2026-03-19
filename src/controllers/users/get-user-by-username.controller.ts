import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { UserWithBranchRow } from "src/entities/models/User";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";
import { UserRepository } from "src/infrastructure/di/repositories";

function presenter(user: UserWithBranchRow) {
  return {
    ...user,
    branch: {
      branch_id: user.branch.branch_id,
      name: user.branch.name,
    },
    created_at: formatDate(user.created_at, "MMMM dd, yyyy"),
    updated_at: formatDate(user.updated_at, "MMMM dd, yyyy"),
  };
}

export const GetUserByUsernameController = async (username: string) => {
  try {
    const user = await UserRepository.getUserByUsername(username);

    if (!user) {
      return err({ message: "Server Error", cause: "User Not Found" });
    }

    return ok(presenter(user));
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger("GetUserByUsernameController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }

    logger("GetUserByUsernameController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
