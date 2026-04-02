import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { presentContainerStatus } from "./get-container-status.controller";
import { presentSupplierRevenue } from "./get-supplier-revenue.controller";

export const GetSupplierReportsController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const [supplierRows, containerRows] = await Promise.all([
      ReportsRepository.getSupplierRevenueSummary(branch_id, date),
      ReportsRepository.getContainerStatusOverview(branch_id),
    ]);

    return ok({
      supplierRevenue: presentSupplierRevenue(supplierRows),
      containerStatus: presentContainerStatus(containerRows),
    });
  } catch (error) {
    logger("GetSupplierReportsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Failed to load supplier reports", cause: error.message });
    }

    return err({
      message: "Failed to load supplier reports",
      cause: "Server Error",
    });
  }
};
