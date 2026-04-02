import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { BidderReportRow, TopBidderEntry } from "src/entities/models/Report";

function presenter(bidders: BidderReportRow[]): TopBidderEntry[] {
  return bidders
    .map((bidder) => ({
      bidder_id: bidder.bidder_id,
      bidder_number: bidder.bidder_number,
      full_name: `${bidder.first_name} ${bidder.last_name}`,
      total_spent: bidder.total_spent,
      items_won: bidder.items_won,
      auctions_attended: bidder.auctions_attended,
    }))
    .sort((a, b) => b.total_spent - a.total_spent);
}

export function presentTopBidders(bidders: BidderReportRow[]): TopBidderEntry[] {
  return presenter(bidders);
}

export const GetTopBiddersController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const bidders = await ReportsRepository.getBiddersWithAuctions(branch_id, date);
    return ok(presenter(bidders));
  } catch (error) {
    logger("GetTopBiddersController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
