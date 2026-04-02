import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { presentAuctionComparison } from "./get-auction-comparison.controller";

export const GetOperationalReportController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const auctions = await ReportsRepository.getTotalSales(branch_id, date);

    return ok({
      auctionComparison: presentAuctionComparison(auctions),
    });
  } catch (error) {
    logger("GetOperationalReportController", error);
    if (error instanceof DatabaseOperationError) {
      return err({
        message: "Failed to load operational reports",
        cause: error.message,
      });
    }

    return err({
      message: "Failed to load operational reports",
      cause: "Server Error",
    });
  }
};
