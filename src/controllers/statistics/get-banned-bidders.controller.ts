import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { BannedBidderRow } from "src/entities/models/BidderBanHistory";
import { StatisticsRepository } from "src/infrastructure/di/repositories";

function presenter(rows: BannedBidderRow[]) {
  return rows.map((row) => ({
    bidder_id: row.bidder_id,
    bidder_number: row.bidder_number,
    full_name: `${row.first_name} ${row.last_name}`,
    branch_name: row.branch_name,
    remarks: row.remarks ?? null,
    banned_at: row.banned_at ? formatDate(row.banned_at, "MMM dd, yyyy") : null,
  }));
}

export const GetBannedBiddersController = async () => {
  try {
    const rows = await StatisticsRepository.getBannedBidders();
    return ok(presenter(rows));
  } catch (error) {
    logger("GetBannedBiddersController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
