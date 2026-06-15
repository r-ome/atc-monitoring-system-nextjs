import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { z } from "zod";
import { BIDDER_STATUS } from "src/entities/models/Bidder";
import { BidderRepository } from "src/infrastructure/di/repositories";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { presentBidder } from "./create-bidder.controller";

const updateBidderStatusSchema = z.object({
  status: z.enum(BIDDER_STATUS),
});

export const UpdateBidderStatusController = async (
  bidder_id: string,
  input: Record<string, unknown>,
) => {
  try {
    const { data, error: inputParseError } =
      updateBidderStatusSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const previous = await BidderRepository.getBidder(bidder_id);
    const updated = await BidderRepository.updateBidderStatus(
      bidder_id,
      data.status,
    );

    logger(
      "UpdateBidderStatusController",
      { bidder_id, status: data.status },
      "info",
    );
    await logActivity(
      "UPDATE",
      "bidder",
      bidder_id,
      `Updated bidder #${updated.bidder_number} status from ${previous.status} to ${updated.status}`,
    );

    return ok(presentBidder(updated));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateBidderStatusController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UpdateBidderStatusController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateBidderStatusController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
