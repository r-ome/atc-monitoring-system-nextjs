import { DatabaseOperationError } from "src/entities/errors/common";
import { BidderBanHistoryRepository } from "src/infrastructure/di/repositories";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";

export const DeleteBanHistoryController = async (
  bidder_ban_history_id: string,
) => {
  try {
    await BidderBanHistoryRepository.delete(bidder_ban_history_id);
    logger("DeleteBanHistoryController", { bidder_ban_history_id }, "info");
    void logActivity("DELETE", "bidder_ban", bidder_ban_history_id, `Deleted ban history ${bidder_ban_history_id}`);
    return ok(null);
  } catch (error) {
    logger("DeleteBanHistoryController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
