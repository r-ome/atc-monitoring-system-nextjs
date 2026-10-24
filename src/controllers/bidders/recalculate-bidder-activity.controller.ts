import { BidderRepository } from "src/infrastructure/di/repositories";
import { InputParseError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { logActivity } from "@/app/lib/log-activity";
import { logger } from "@/app/lib/logger";

export const RecalculateBidderActivityController = async (branch_id: string, recordActivity = true) => {
  try {
    const result = await BidderRepository.recalculateActivity(branch_id);
    if (recordActivity) {
      await logActivity("UPDATE", "branch", branch_id,
        `Recalculated bidder statuses; activated ${result.activated}; deactivated ${result.deactivated}; cutoff ${result.cutoff}; branch ${branch_id}`);
    }
    return ok(result);
  } catch (error) {
    if (error instanceof InputParseError) return err({ message: error.message });
    logger("RecalculateBidderActivityController", error);
    return err({ message: "Could not recalculate bidder statuses. Try again or contact an administrator." });
  }
};
