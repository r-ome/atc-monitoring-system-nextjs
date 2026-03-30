import { createContainerUseCase } from "src/application/use-cases/containers/create-container.use-case";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  createContainerSchema,
  ContainerRow,
} from "src/entities/models/Container";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";

const DATE_FORMAT = "MMM dd, yyyy";

export const presentContainer = (container: ContainerRow) => {
  return {
    ...container,
    duties_and_taxes: Number(container.duties_and_taxes),
    arrival_date: container.arrival_date
      ? formatDate(container.arrival_date, DATE_FORMAT)
      : null,
    due_date: container.due_date
      ? formatDate(container.due_date, DATE_FORMAT)
      : null,
    created_at: formatDate(container.created_at, DATE_FORMAT),
    updated_at: formatDate(container.updated_at, DATE_FORMAT),
    deleted_at: container.deleted_at
      ? formatDate(container.deleted_at, DATE_FORMAT)
      : null,
  };
};

export const CreateContainerController = async (
  input: Record<string, unknown>,
) => {
  const ctx = RequestContext.getStore();
  const user_context = {
    username: ctx?.username,
    branch_name: ctx?.branch_name,
  };

  try {
    const parsed = {
      ...input,
      arrival_date: input.arrival_date ? new Date(input.arrival_date as string) : null,
      due_date: input.due_date ? new Date(input.due_date as string) : null,
    };

    const { data, error: inputParseError } =
      createContainerSchema.safeParse(parsed);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const container = await createContainerUseCase(data);
    logger("CreateContainerController", { data, ...user_context }, "info");
    await logActivity("CREATE", "container", container.container_id, `Added container ${container.barcode}`);
    return ok(presentContainer(container));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("CreateContainerController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("CreateContainerController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("CreateContainerController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
