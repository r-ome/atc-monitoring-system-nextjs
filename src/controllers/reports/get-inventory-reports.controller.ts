import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { presentPriceComparison } from "./get-price-comparison.controller";
import { presentRefundCancellation } from "./get-refund-cancellation.controller";

export const GetInventoryReportsController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const [refundRows, priceComparisonRows] =
      await Promise.all([
        ReportsRepository.getRefundCancellationItems(branch_id, date),
        ReportsRepository.getPriceComparisonByMonth(branch_id, date),
      ]);

    const refundCancellation = presentRefundCancellation(refundRows);

    return ok({
      refundCancellation,
      refundCancellationByBidder: refundCancellation,
      priceComparison: presentPriceComparison(priceComparisonRows),
    });
  } catch (error) {
    logger("GetInventoryReportsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Failed to load inventory reports", cause: error.message });
    }

    return err({
      message: "Failed to load inventory reports",
      cause: "Server Error",
    });
  }
};
