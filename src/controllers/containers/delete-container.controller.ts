import { deleteContainerUseCase } from "src/application/use-cases/containers/delete-container.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

export const DeleteContainerController = async (container_id: string) => {
  try {
    const container = await deleteContainerUseCase(container_id);
    return ok(container);
  } catch (error) {
    logger("DeleteContainerController", error);
    if (error instanceof InputParseError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
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
