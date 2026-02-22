import {
  InputParseError,
  DatabaseOperationError,
} from "src/entities/errors/common";
import { unregisterBidderUseCase } from "src/application/use-cases/auctions/unregister-bidder.use-case";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

export const UnregisterBidderController = async (auction_bidder_id: string) => {
  try {
    const res = await unregisterBidderUseCase(auction_bidder_id);
    return ok(res);
  } catch (error) {
    logger("UnregisterBidderController", error);
    if (error instanceof InputParseError) {
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
