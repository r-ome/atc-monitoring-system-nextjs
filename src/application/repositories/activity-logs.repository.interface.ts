import {
  ActivityLogRow,
  CreateActivityLogInput,
} from "src/entities/models/ActivityLog";

export interface IActivityLogRepository {
  createActivityLog(input: CreateActivityLogInput): Promise<ActivityLogRow>;
  getActivityLogs(date: string): Promise<ActivityLogRow[]>;
}
