import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { BidderReportRow, UnpaidBidderEntry } from "src/entities/models/Report";

function presenter(bidders: BidderReportRow[]): UnpaidBidderEntry[] {
  return bidders
    .map((bidder) => ({
      bidder_id: bidder.bidder_id,
      bidder_number: bidder.bidder_number,
      full_name: `${bidder.first_name} ${bidder.last_name}`,
      total_balance: bidder.total_balance,
      auctions_with_balance: bidder.auctions_with_balance,
    }))
    .filter((entry) => entry.total_balance > 0)
    .sort((a, b) => b.total_balance - a.total_balance);
}

export function presentUnpaidBidders(bidders: BidderReportRow[]): UnpaidBidderEntry[] {
  return presenter(bidders);
}

export const GetUnpaidBiddersController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const bidders = await ReportsRepository.getBiddersWithAuctions(branch_id, date);
    return ok(presenter(bidders));
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
