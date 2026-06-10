import { logger } from "@/app/lib/logger";
import { ActivityLogRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { ActivityLog, ActivityLogRow } from "src/entities/models/ActivityLog";
import { err, ok } from "src/entities/models/Result";

function presenter(log: ActivityLogRow): ActivityLog {
  return {
    activity_log_id: log.activity_log_id,
    username: log.username,
    branch_name: log.branch_name,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    description: log.description,
    created_at: log.created_at.toISOString(),
  };
}

export const GetExpenseUpdateLogsController = async (
  expense_ids: string[],
  branch_id?: string,
) => {
  try {
    const logs = await ActivityLogRepository.getExpenseUpdateLogs(
      expense_ids,
      branch_id,
    );

    return ok(logs.map(presenter));
  } catch (error) {
    logger("GetExpenseUpdateLogsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
