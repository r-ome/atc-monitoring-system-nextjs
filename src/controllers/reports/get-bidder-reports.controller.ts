import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { presentBidderActivity } from "./get-bidder-activity.controller";
import { presentTopBidders } from "./get-top-bidders.controller";
import { presentUnpaidBidders } from "./get-unpaid-bidders.controller";

export const GetBidderReportsController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const bidders = await ReportsRepository.getBiddersWithAuctions(
      branch_id,
      date,
    );

    return ok({
      unpaid: presentUnpaidBidders(bidders),
      activity: presentBidderActivity(bidders),
      topBidders: presentTopBidders(bidders),
    });
  } catch (error) {
    logger("GetBidderReportsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Failed to load bidder reports", cause: error.message });
    }

    return err({
      message: "Failed to load bidder reports",
      cause: "Server Error",
    });
  }
};
