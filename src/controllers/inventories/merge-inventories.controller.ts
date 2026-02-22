import { logger } from "@/app/lib/logger";
import { mergeInventoriesUseCase } from "src/application/use-cases/inventories/merge-inventories.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  mergeInventoriesSchema,
  MergeInventoriesInput,
} from "src/entities/models/Inventory";
import { ok, err } from "src/entities/models/Result";

export const MergeInventoriesController = async (
  input: Partial<MergeInventoriesInput>,
) => {
  try {
    const { data, error: inputParseError } =
      mergeInventoriesSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    await mergeInventoriesUseCase(data);
    return ok({});
  } catch (error) {
    logger("MergeInventoriesController", error);
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
