import { DatabaseOperationError } from "src/entities/errors/common";
import { BidderRequirementRepository } from "src/infrastructure/di/repositories";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";

export const DeleteBidderRequirementController = async (
  requirement_id: string,
) => {
  try {
    await BidderRequirementRepository.delete(requirement_id);
    logger("DeleteBidderRequirementController", { requirement_id }, "info");
    await logActivity("DELETE", "bidder_requirement", requirement_id, `Deleted bidder requirement ${requirement_id}`);
    return ok(null);
  } catch (error) {
    logger("DeleteBidderRequirementController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
