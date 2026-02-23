import { logger } from "@/app/lib/logger";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { startAuctionUseCase } from "src/application/use-cases/auctions/start-auction.use-case";
import { DatabaseOperationError } from "src/entities/errors/common";
import { AuctionRow } from "src/entities/models/Auction";
import { err, ok } from "src/entities/models/Result";

function presenter(auction: AuctionRow) {
  return auction;
}

export const StartAuctionController = async (auction_date: string) => {
  const ctx = RequestContext.getStore();
  const user_context = { username: ctx?.username, branch_name: ctx?.branch_name };

  try {
    const input = new Date(auction_date);
    const auction = await startAuctionUseCase(input);
    logger("StartAuctionController", { auction_date, ...user_context }, "info");
    return ok(presenter(auction));
  } catch (error) {
    logger("StartAuctionController", error, "error", user_context);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
