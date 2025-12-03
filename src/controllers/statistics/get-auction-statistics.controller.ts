import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Response";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { getAuctionsStatisticsUseCase } from "src/application/use-cases/statistics/get-auctions-statistics.use-case";
import { AuctionsStatisticsSchema } from "src/entities/models/Statistics";

function presenter(auctions: AuctionsStatisticsSchema[]) {
  return auctions.map((auction) => ({
    auction_id: auction.auction_id,
    auction_date: formatDate(auction.auction_date, "MMM dd, yyyy"),
    total_registered_bidders: auction.total_registered_bidders,
    total_items: auction.total_items,
    total_cancelled_items: auction.total_cancelled_items,
    total_refunded_items: auction.total_refunded_items,
    total_bidders_with_balance: auction.total_bidders_with_balance,
    container_barcodes: auction.container_barcodes,
  }));
}

export const GetAuctionsStatisticsController = async () => {
  try {
    const auction_statistics = await getAuctionsStatisticsUseCase();
    return ok(presenter(auction_statistics));
  } catch (error) {
    logger("GetAuctionsStatisticsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
