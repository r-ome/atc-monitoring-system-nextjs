import { startAuctionUseCase } from "src/application/use-cases/auctions/start-auction.use-case";
import { DatabaseOperationError } from "src/entities/errors/common";
import { AuctionSchema } from "src/entities/models/Auction";
import { err, ok } from "src/entities/models/Response";

function presenter(auction: Omit<AuctionSchema, "registered_bidders">) {
  return auction;
}

export const StartAuctionController = async (auction_date: string) => {
  try {
    const input = new Date(auction_date);
    const auction = await startAuctionUseCase(input);
    return ok(presenter(auction));
  } catch (error) {
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
