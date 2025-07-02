import { logger } from "@/app/lib/logger";
import { refundAuctionsInventoriesUseCase } from "src/application/use-cases/payments/refund-auctions-inventories.use-case";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  RefundAuctionInventories,
  type RefundAuctionInventories as RefundAuctionInventoriesType,
} from "src/entities/models/Payment";
import { ok, err } from "src/entities/models/Response";

export const RefundAuctionsInventoriesController = async (
  input: Partial<RefundAuctionInventoriesType>
) => {
  try {
    const auction_inventories: RefundAuctionInventoriesType["auction_inventories"] =
      typeof input.auction_inventories === "string"
        ? JSON.parse(input.auction_inventories)
        : {};

    const formattedInput = {
      auction_bidder_id: input.auction_bidder_id,
      reason: input.reason,
      auction_inventories: auction_inventories.map((item) => ({
        auction_inventory_id: item.auction_inventory_id,
        inventory_id: item.inventory_id,
        prev_price: item.prev_price,
        new_price: item.new_price,
      })),
    };

    const { data, error: inputParseError } =
      RefundAuctionInventories.safeParse(formattedInput);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const res = await refundAuctionsInventoriesUseCase(data);

    return ok(res);
  } catch (error) {
    logger("RefundAuctionsInventoriesController", error);
    if (error instanceof InputParseError) {
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
