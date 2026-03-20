import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { BidderReportRow, UnpaidBidderEntry } from "src/entities/models/Report";

function presenter(bidders: BidderReportRow[]): UnpaidBidderEntry[] {
  return bidders
    .map((bidder) => {
      const auctionsWithBalance = bidder.auctions_joined.filter(
        (ab) => ab.balance > 0,
      );
      const totalBalance = auctionsWithBalance.reduce(
        (sum, ab) => sum + ab.balance,
        0,
      );
      return {
        bidder_id: bidder.bidder_id,
        bidder_number: bidder.bidder_number,
        full_name: `${bidder.first_name} ${bidder.last_name}`,
        total_balance: totalBalance,
        auctions_with_balance: auctionsWithBalance.length,
      };
    })
    .filter((entry) => entry.total_balance > 0)
    .sort((a, b) => b.total_balance - a.total_balance);
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
