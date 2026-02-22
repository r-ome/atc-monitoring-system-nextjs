import { logger } from "@/app/lib/logger";
import { updateContainerUseCase } from "src/application/use-cases/containers/update-container.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  createContainerSchema,
  CreateContainerInput,
  ContainerWithSupplierRow,
} from "src/entities/models/Container";
import { err, ok } from "src/entities/models/Result";

function presenter(container: ContainerWithSupplierRow) {
  return {
    ...container,
    duties_and_taxes: Number(container.duties_and_taxes),
  };
}

export const UpdateContainerController = async (
  container_id: string,
  input: Partial<CreateContainerInput>,
) => {
  try {
    input.arrival_date = input.arrival_date
      ? new Date(input.arrival_date)
      : null;

    const { data, error: inputParseError } =
      createContainerSchema.safeParse(input);

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
