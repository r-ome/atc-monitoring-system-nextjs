import { AuctionRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { presenter } from "./get-auction.presenter";

export const GetAuctionController = async (auction_date: Date) => {
  try {
    const auction = await AuctionRepository.getAuction(auction_date);
    if (!auction) {
      throw new NotFoundError("Auction not found!");
    }
    return ok(presenter(auction));
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger("GetAuctionController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("GetAuctionController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
