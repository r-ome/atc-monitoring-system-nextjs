import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { BidderReportRow, BidderActivityEntry } from "src/entities/models/Report";

function presenter(bidders: BidderReportRow[]): BidderActivityEntry[] {
  return bidders.map((bidder) => {
    const paidItems = bidder.auctions_joined.flatMap((ab) =>
      ab.auctions_inventories.filter((ai) => ai.status === "PAID"),
    );

    const totalSpent = paidItems.reduce((sum, ai) => sum + ai.price, 0);

    return {
      bidder_id: bidder.bidder_id,
      bidder_number: bidder.bidder_number,
      full_name: `${bidder.first_name} ${bidder.last_name}`,
      status: bidder.status,
      auctions_attended: bidder.auctions_joined.length,
      items_won: paidItems.length,
      total_spent: totalSpent,
    };
  });
}

export const GetBidderActivityController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const bidders = await ReportsRepository.getBiddersWithAuctions(branch_id, date);
    return ok(presenter(bidders));
  } catch (error) {
    logger("GetBidderActivityController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
