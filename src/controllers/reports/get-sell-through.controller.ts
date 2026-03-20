import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { SellThroughRow, SellThroughEntry } from "src/entities/models/Report";
import { formatDate } from "@/app/lib/utils";

function presenter(rows: SellThroughRow[]): SellThroughEntry[] {
  const auctionMap = new Map<string, SellThroughEntry>();

  for (const row of rows) {
    const auction = row.auction_bidder.auctions;
    const id = auction.auction_id;

    if (!auctionMap.has(id)) {
      auctionMap.set(id, {
        auction_id: id,
        auction_date: formatDate(auction.created_at, "MMM dd, yyyy"),
        total: 0,
        paid: 0,
        unpaid: 0,
        partial: 0,
        cancelled: 0,
        refunded: 0,
        discrepancy: 0,
        sell_through_rate: 0,
      });
    }

    const entry = auctionMap.get(id)!;
    entry.total += 1;

    switch (row.status) {
      case "PAID":       entry.paid += 1;        break;
      case "UNPAID":     entry.unpaid += 1;      break;
      case "PARTIAL":    entry.partial += 1;     break;
      case "CANCELLED":  entry.cancelled += 1;   break;
      case "REFUNDED":   entry.refunded += 1;    break;
      case "DISCREPANCY":entry.discrepancy += 1; break;
    }
  }

  return Array.from(auctionMap.values())
    .map((entry) => ({
      ...entry,
      sell_through_rate:
        entry.total > 0
          ? Math.round((entry.paid / entry.total) * 100)
          : 0,
    }))
    .sort((a, b) => a.auction_date.localeCompare(b.auction_date));
}

export const GetSellThroughController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const rows = await ReportsRepository.getAuctionInventoriesForSellThrough(branch_id, date);
    return ok(presenter(rows));
  } catch (error) {
    logger("GetSellThroughController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};
