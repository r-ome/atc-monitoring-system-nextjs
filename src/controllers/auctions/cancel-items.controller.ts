import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { cancelItemsUseCase } from "src/application/use-cases/auctions/cancel-items.use-case";
import { cancelItemsSchema, CancelItemsInput } from "src/entities/models/Inventory";
import { logger } from "@/app/lib/logger";

export const CancelItemsController = async (
  input: Partial<CancelItemsInput>,
) => {
  try {
    const { data, error: inputParseError } = cancelItemsSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const res = await cancelItemsUseCase(data);
    return ok(res);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("CancelItemsController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }

    if (error instanceof NotFoundError) {
      logger("CancelItemsController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }

    logger("CancelItemsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
