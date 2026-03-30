import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { updateContainerUseCase } from "src/application/use-cases/containers/update-container.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { updateContainerSchema } from "src/entities/models/Container";
import { err, ok } from "src/entities/models/Result";
import { presentContainer } from "./create-container.controller";

export const UpdateContainerController = async (
  container_id: string,
  input: Record<string, unknown>,
) => {
  try {
    const parsed = {
      ...input,
      arrival_date: input.arrival_date ? new Date(input.arrival_date as string) : null,
      due_date: input.due_date ? new Date(input.due_date as string) : null,
    };

    const { data, error: inputParseError } =
      updateContainerSchema.safeParse(parsed);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const container = await updateContainerUseCase(container_id, data);
    void logActivity("UPDATE", "container", container_id, `Updated container ${container.barcode}`);
    return ok(presentContainer(container));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateContainerController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UpdateContainerController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateContainerController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
