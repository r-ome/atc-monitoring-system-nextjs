import { ActivityLog, ActivityLogRow } from "src/entities/models/ActivityLog";

export function presentActivityLog(log: ActivityLogRow): ActivityLog {
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
