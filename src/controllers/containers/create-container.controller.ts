import { createContainerUseCase } from "src/application/use-cases/containers/create-container.use-case";
import {
  ContainerInsertSchema,
  type ContainerInsertSchema as ContainerInsertSchemaType,
  ContainerSchema,
} from "src/entities/models/Container";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { format } from "date-fns";
import { ok, err } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";

const presenter = (
  container: Omit<ContainerSchema, "branch" | "inventories" | "supplier">
) => {
  const date_format = "MMM dd, yyyy";
  return {
    ...container,
    eta_to_ph: container.eta_to_ph
      ? format(container.eta_to_ph, date_format)
      : null,
    departure_date: container.departure_date
      ? format(container.departure_date, date_format)
      : null,
    arrival_date: container.arrival_date
      ? format(container.arrival_date, date_format)
      : null,
    auction_start_date: container.auction_start_date
      ? format(container.auction_start_date, date_format)
      : null,
    auction_end_date: container.auction_end_date
      ? format(container.auction_end_date, date_format)
      : null,
    due_date: container.due_date
      ? format(container.due_date, date_format)
      : null,
    created_at: format(container.created_at, date_format),
    updated_at: format(container.updated_at, date_format),
    deleted_at: container.deleted_at
      ? format(container.deleted_at, date_format)
      : null,
  };
};

export const CreateContainerController = async (
  input: Partial<ContainerInsertSchemaType>
) => {
  try {
    input = {
      ...input,
      eta_to_ph: input.eta_to_ph ? new Date(input.eta_to_ph) : null,
      departure_date: input.departure_date
        ? new Date(input?.departure_date)
        : null,
      arrival_date: input.arrival_date ? new Date(input?.arrival_date) : null,
      auction_start_date: input.auction_start_date
        ? new Date(input?.auction_start_date)
        : null,
      auction_end_date: input.auction_end_date
        ? new Date(input?.auction_end_date)
        : null,
      due_date: input.due_date ? new Date(input?.due_date) : null,
    };

    const { data, error: inputParseError } =
      ContainerInsertSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const container = await createContainerUseCase(data);
    return ok(presenter(container));
  } catch (error) {
    logger("CreateContainerController", error);
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
