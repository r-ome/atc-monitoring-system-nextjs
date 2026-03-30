import { Prisma } from "@prisma/client";

export type ActivityLogRow = Prisma.activity_logsGetPayload<object>;

export type ActivityAction = "CREATE" | "UPDATE" | "DELETE";

export type CreateActivityLogInput = {
  username: string;
  branch_id: string;
  branch_name: string;
  action: ActivityAction;
  entity_type: string;
  entity_id: string;
  description: string;
};

export type ActivityLog = {
  activity_log_id: string;
  username: string;
  branch_name: string;
  action: ActivityAction;
  entity_type: string;
  entity_id: string;
  description: string;
  created_at: string;
};
