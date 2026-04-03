import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  ActivityLogRepository,
  UserRepository,
} from "src/infrastructure/di/repositories";
import {
  ActivityAction,
  CreateActivityLogInput,
} from "src/entities/models/ActivityLog";
import { logger } from "@/app/lib/logger";

export async function logActivityWithContext(
  input: CreateActivityLogInput,
): Promise<void> {
  try {
    const user = await UserRepository.getUserByUsername(input.username);

    if (user?.role === "SUPER_ADMIN") {
      return;
    }

    await ActivityLogRepository.createActivityLog(input);
  } catch (error) {
    logger("logActivityWithContext", error, "error");
  }
}

export async function logActivity(
  action: ActivityAction,
  entity_type: string,
  entity_id: string,
  description: string,
): Promise<void> {
  try {
    const ctx = RequestContext.getStore();
    if (!ctx?.username || !ctx?.branch_id || !ctx?.branch_name) return;

    await logActivityWithContext({
      username: ctx.username,
      branch_id: ctx.branch_id,
      branch_name: ctx.branch_name,
      action,
      entity_type,
      entity_id,
      description,
    });
  } catch (error) {
    logger("logActivity", error, "error");
  }
}
