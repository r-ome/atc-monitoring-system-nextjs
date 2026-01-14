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
import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";

const presenter = (
  container: Omit<ContainerSchema, "branch" | "inventories" | "supplier">
) => {
  const date_format = "MMM dd, yyyy";
  return {
    ...container,
    duties_and_taxes: Number(container.duties_and_taxes),
    arrival_date: container.arrival_date
      ? formatDate(container.arrival_date, date_format)
      : null,
    due_date: container.due_date
      ? formatDate(container.due_date, date_format)
      : null,
    created_at: formatDate(container.created_at, date_format),
    updated_at: formatDate(container.updated_at, date_format),
    deleted_at: container.deleted_at
      ? formatDate(container.deleted_at, date_format)
      : null,
  };
};

export const CreateContainerController = async (
  input: Partial<ContainerInsertSchemaType>
) => {
  try {
    input = {
      ...input,
      arrival_date: input.arrival_date ? new Date(input?.arrival_date) : null,
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
