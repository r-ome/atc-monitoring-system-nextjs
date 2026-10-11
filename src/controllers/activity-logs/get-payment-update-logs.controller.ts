import { logger } from "@/app/lib/logger";
import { ActivityLogRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { presentActivityLog } from "./present-activity-log";

export const GetPaymentUpdateLogsController = async (
  payment_ids: string[],
  branch_id?: string,
) => {
  try {
    const logs = await ActivityLogRepository.getPaymentUpdateLogs(
      payment_ids,
      branch_id,
    );
    return ok(logs.map(presentActivityLog));
  } catch (error) {
    logger("GetPaymentUpdateLogsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
