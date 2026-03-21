import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { AuctionWithSalesRow } from "src/entities/models/Auction";
import { AuctionComparisonEntry } from "src/entities/models/Report";
import { formatDate } from "@/app/lib/utils";

function presenter(auctions: AuctionWithSalesRow[]): AuctionComparisonEntry[] {
  return auctions.map((auction) => {
    const items = auction.registered_bidders.flatMap(
      (rb) => rb.auctions_inventories,
    );
    const total_sales = items
      .filter((ai) => ai.status === "PAID")
      .reduce((sum, ai) => sum + ai.price, 0);
    const items_sold = items.filter((ai) => ai.status === "PAID").length;
    const total_registration_fee = auction.registered_bidders.reduce(
      (sum, rb) => sum + rb.registration_fee,
      0,
    );

    return {
      auction_id: auction.auction_id,
      auction_date: formatDate(auction.created_at, "MMM dd, yyyy"),
      total_sales,
      total_registration_fee,
      items_sold,
      total_items: items.length,
      bidder_count: auction.registered_bidders.length,
    };
  });
}

export function presentAuctionComparison(auctions: AuctionWithSalesRow[]): AuctionComparisonEntry[] {
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
