import { voidItemsUseCase } from "src/application/use-cases/inventories/void-items.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Response";
import {
  AuctionsInventorySchema,
  VoidItemsSchema,
} from "src/entities/models/Auction";
import { format } from "date-fns";

const presenter = (
  auctionInventories: Omit<
    AuctionsInventorySchema,
    "auction_bidder" | "inventory" | "receipt" | "histories"
  >[]
) => {
  const date_format = "MMMM dd, yyyy";
  return auctionInventories.map((auction_inventory) => ({
    ...auction_inventory,
    created_at: format(auction_inventory.created_at, date_format),
    updated_at: format(auction_inventory.updated_at, date_format),
  }));
};

export const VoidItemsController = async (input: Partial<VoidItemsSchema>) => {
  try {
    const { data, error: inputParseError } = VoidItemsSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const res = await voidItemsUseCase(data);
    return ok(presenter(res));
  } catch (error) {
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
