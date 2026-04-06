import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  createBanHistorySchema,
  BidderBanHistoryRow,
} from "src/entities/models/BidderBanHistory";
import {
  BidderBanHistoryRepository,
  BidderRepository,
} from "src/infrastructure/di/repositories";
import { formatDate } from "@/app/lib/utils";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";

export const presentBanHistory = (row: BidderBanHistoryRow) => ({
  ...row,
  created_at: formatDate(row.created_at, "MMM dd, yyyy"),
  updated_at: formatDate(row.updated_at, "MMM dd, yyyy"),
});

export const CreateBanHistoryController = async (
  bidder_id: string,
  input: Record<string, unknown>,
) => {
  const ctx = RequestContext.getStore();
  const user_context = { username: ctx?.username, branch_name: ctx?.branch_name };

  try {
    const { data, error: inputParseError } =
      createBanHistorySchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const history = await BidderBanHistoryRepository.create(bidder_id, data);
    const bidder = await BidderRepository.getBidder(bidder_id);
    logger("CreateBanHistoryController", { bidder_id, ...user_context }, "info");
    await logActivity(
      "CREATE",
      "bidder_ban",
      history.bidder_ban_history_id,
      `Banned bidder #${bidder.bidder_number}: ${data.remarks}`,
    );
    return ok(presentBanHistory(history));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("CreateBanHistoryController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("CreateBanHistoryController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
