import { BidderListRow } from "src/entities/models/Bidder";
import { BidderRepository } from "src/infrastructure/di/repositories";
import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { formatDistanceToNow } from "date-fns";

export const presentBidders = (bidders: BidderListRow[]) => {
  const date_format = "MMM dd, yyyy";
  return bidders.map((item) => ({
    ...item,
    branch: {
      branch_id: item.branch.branch_id,
      name: item.branch.name,
    },
    last_active: {
      date: item.last_activity_at ? formatDate(item.last_activity_at, date_format) : null,
      timestamp: item.last_activity_at?.toISOString() ?? null,
      duration: item.last_activity_at ? formatDistanceToNow(item.last_activity_at) : null,
    },
    remarks: item.remarks || undefined,
    full_name: `${item.first_name} ${item.last_name}`,
    birthdate: item.birthdate ? formatDate(item.birthdate, date_format) : null,
    created_at: formatDate(item.created_at, date_format),
    updated_at: formatDate(item.updated_at, date_format),
    deleted_at: item.deleted_at
      ? formatDate(item.deleted_at, date_format)
      : null,
  }));
};

export const GetBiddersController = async () => {
  try {
    const bidders = await BidderRepository.getBidders();
    return ok(presentBidders(bidders));
  } catch (error) {
    logger("GetBiddersController", error);
    if (error instanceof DatabaseOperationError) {
      return err({
        message: "Server Error",
        cause: error.message,
      });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
