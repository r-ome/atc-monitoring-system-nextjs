import { DatabaseOperationError } from "src/entities/errors/common";
import { getActivityLogsUseCase } from "src/application/use-cases/activity-logs/get-activity-logs.use-case";
import { ActivityLog, ActivityLogRow } from "src/entities/models/ActivityLog";
import { err, ok } from "src/entities/models/Result";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

function presenter(log: ActivityLogRow): ActivityLog {
  return {
    activity_log_id: log.activity_log_id,
    username: log.username,
    branch_name: log.branch_name,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    description: log.description,
    created_at: formatDate(log.created_at, "hh:mm:ss a"),
  };
}

export const GetActivityLogsController = async (date: string) => {
  try {
    const logs = await getActivityLogsUseCase(date);
    return ok(logs.map(presenter));
  } catch (error) {
    logger("GetActivityLogsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
