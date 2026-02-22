import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { UserWithBranchRow } from "src/entities/models/User";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";
import { getUserByUsernameUseCase } from "src/application/use-cases/users/get-user-by-username.use-case";

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
    const user = await getUserByUsernameUseCase(username);

    if (!user) {
      return err({ message: "Server Error", cause: "User Not Found" });
    }

    return ok(presenter(user));
  } catch (error) {
    logger("GetUserByUsernameController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error?.cause });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
