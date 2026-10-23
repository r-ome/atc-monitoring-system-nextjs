import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { AuctionRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError, InputParseError, NotFoundError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";

export const StartAuctionController = async (auction_date: string, branch_id: string, recordActivity = true) => {
  const ctx = RequestContext.getStore();
  const user_context = { username: ctx?.username, branch_name: ctx?.branch_name };

  try {
    const input = new Date(auction_date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(auction_date) || !Number.isFinite(input.getTime()) || input.toISOString().slice(0, 10) !== auction_date) {
      throw new InputParseError("Select a valid auction date.");
    }
    const { auction, bidder_activity } = await AuctionRepository.startAuction(input, branch_id);
    logger("StartAuctionController", { auction_date, ...user_context }, "info");
    if (recordActivity) await logActivity("CREATE", "auction", auction.auction_id,
      `Started auction on ${auction_date}` + (bidder_activity
        ? `; bidder statuses: ${bidder_activity.activated} active, ${bidder_activity.deactivated} inactive; cutoff ${bidder_activity.cutoff}; branch ${auction.branch_id}`
        : ""));
    return ok({ ...auction, bidder_activity });
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      return err({ message: error.message, cause: error.cause });
    }
    logger("StartAuctionController", error, "error", user_context);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
