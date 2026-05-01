import { logger } from "@/app/lib/logger";
import { DatabaseOperationError } from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import {
  UnpaidBidderBalanceSummary,
  UnpaidBidderBranchBalanceRow,
} from "src/entities/models/Statistics";
import { StatisticsRepository } from "src/infrastructure/di/repositories";

function presenter(
  rows: UnpaidBidderBranchBalanceRow[],
): UnpaidBidderBalanceSummary {
  const branches = rows.map((row) => ({
    branch_id: row.branch_id,
    branch_name: row.branch_name,
    total_balance: Number(row.total_balance),
  }));

  return {
    branches,
    total_balance: branches.reduce(
      (sum, branch) => sum + branch.total_balance,
      0,
    ),
  };
}

export const GetUnpaidBidderBalanceSummaryController = async () => {
  try {
    const summary = await StatisticsRepository.getUnpaidBidderBalanceSummary();
    return ok(presenter(summary));
  } catch (error) {
    logger("GetUnpaidBidderBalanceSummaryController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
