import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Response";
import { cancelItemsUseCase } from "src/application/use-cases/auctions/cancel-items.use-case";
import { CancelItems, CancelItemsSchema } from "src/entities/models/Inventory";

export const CancelItemsController = async (
  input: Partial<CancelItemsSchema>
) => {
  try {
    const { data, error: inputParseError } = CancelItems.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const res = await cancelItemsUseCase(data);
    return ok(res);
  } catch (error) {
    if (error instanceof InputParseError) {
      return err({ message: error.message, cause: error?.cause });
    }

    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error?.cause });
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
