import {
  AuctionInventoryUpdateSchema,
  AuctionInventoryUpdateSchema as AuctionInventoryUpdateSchemaType,
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
  input: Partial<AuctionInventoryUpdateSchemaType>,
) => {
  try {
    const { data, error: inputParseError } =
      AuctionInventoryUpdateSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const res = await updateAuctionItemUseCase(data);
    return ok(res);
  } catch (error) {
    logger("UpdateAuctionItemController", error);
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
