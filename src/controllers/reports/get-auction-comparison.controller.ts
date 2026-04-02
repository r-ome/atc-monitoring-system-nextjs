import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import {
  AuctionComparisonEntry,
  AuctionSalesSummaryRow,
} from "src/entities/models/Report";
import { formatDate } from "@/app/lib/utils";

function presenter(auctions: AuctionSalesSummaryRow[]): AuctionComparisonEntry[] {
  return auctions.map((auction) => {
    return {
      auction_id: auction.auction_id,
      auction_date: formatDate(auction.created_at, "MMM dd, yyyy"),
      total_sales: auction.total_sales,
      total_registration_fee: auction.total_registration_fee,
      items_sold: auction.items_sold,
      total_items: auction.total_items,
      bidder_count: auction.total_bidders,
    };
  });
}

export function presentAuctionComparison(
  auctions: AuctionSalesSummaryRow[],
): AuctionComparisonEntry[] {
  return presenter(auctions);
}

export const GetAuctionComparisonController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const auctions = await ReportsRepository.getTotalSales(branch_id, date);
    return ok(presenter(auctions));
  } catch (error) {
    logger("GetAuctionComparisonController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
