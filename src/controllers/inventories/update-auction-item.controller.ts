import {
  updateAuctionInventorySchema,
  UpdateAuctionInventoryInput,
} from "src/entities/models/Inventory";
import { updateAuctionItemUseCase } from "src/application/use-cases/inventories/update-auction-item.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

export const UpdateAuctionItemController = async (
  input: Partial<UpdateAuctionInventoryInput>,
) => {
  try {
    const { data, error: inputParseError } =
      updateAuctionInventorySchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const res = await updateAuctionItemUseCase(data);
    return ok(res);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateAuctionItemController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UpdateAuctionItemController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }

    logger("UpdateAuctionItemController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
