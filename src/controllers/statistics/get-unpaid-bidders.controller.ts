import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { AuctionBidderWithBidderInventoriesRow } from "src/entities/models/Bidder";
import { StatisticsRepository } from "src/infrastructure/di/repositories";
import { formatDistanceToNow } from "date-fns";

function presenter(bidders: AuctionBidderWithBidderInventoriesRow[]) {
  const date_format = "MMM d, yyyy";
  return bidders.map((bidder) => ({
    bidder_id: bidder.bidder_id,
    bidder_number: bidder.bidder.bidder_number,
    first_name: bidder.bidder.first_name,
    last_name: bidder.bidder.last_name,
    auction_date: formatDate(bidder.created_at, date_format),
    auction_duration: formatDistanceToNow(new Date(bidder.created_at), {
      addSuffix: true,
    }),
    balance: bidder.balance,
    items: bidder.auctions_inventories.filter(
      (item) => item.status === "UNPAID",
    ).length,
  }));
}

export const GetUnpaidBiddersController = async () => {
  try {
    const unpaid_bidders = await StatisticsRepository.getUnpaidBidders();
    return ok(presenter(unpaid_bidders));
  } catch (error) {
    logger("GetUnpaidBiddersController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
