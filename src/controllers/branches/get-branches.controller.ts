import { BranchRepository } from "src/infrastructure/di/repositories";
import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { presentBranch } from "./create-branch.controller";

export const GetBranchesController = async () => {
  try {
    const branches = await BranchRepository.getBranches();
    return ok(branches.map(presentBranch));
  } catch (error) {
    logger("GetBranchesController", error);
    if (error instanceof DatabaseOperationError) {
      return err({
        message: "Server Error",
        cause: error.message,
      });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
