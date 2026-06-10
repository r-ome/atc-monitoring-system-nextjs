import {
  ActivityLogRow,
  CreateActivityLogInput,
} from "src/entities/models/ActivityLog";

export interface IActivityLogRepository {
  createActivityLog(input: CreateActivityLogInput): Promise<ActivityLogRow>;
  getActivityLogs(date: string): Promise<ActivityLogRow[]>;
  getExpenseUpdateLogs(
    expense_ids: string[],
    branch_id?: string,
  ): Promise<ActivityLogRow[]>;
}
