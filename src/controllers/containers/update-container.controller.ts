import { logger } from "@/app/lib/logger";
import { updateContainerUseCase } from "src/application/use-cases/containers/update-container.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  ContainerInsertSchema,
  ContainerSchema,
} from "src/entities/models/Container";
import { err, ok } from "src/entities/models/Response";

function presenter(container: Omit<ContainerSchema, "inventories">) {
  return container;
}

export const UpdateContainerController = async (
  container_id: string,
  input: Partial<ContainerInsertSchema>
) => {
  try {
    input.eta_to_ph = input.eta_to_ph ? new Date(input.eta_to_ph) : null;
    input.departure_date = input.departure_date
      ? new Date(input.departure_date)
      : null;
    input.arrival_date = input.arrival_date
      ? new Date(input.arrival_date)
      : null;
    input.auction_start_date = input.auction_start_date
      ? new Date(input.auction_start_date)
      : null;
    input.auction_end_date = input.auction_end_date
      ? new Date(input.auction_end_date)
      : null;

    const { data, error: inputParseError } =
      ContainerInsertSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const container = await updateContainerUseCase(container_id, data);
    return ok(presenter(container));
  } catch (error) {
    logger("UpdateContainerController", error);
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
