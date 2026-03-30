import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { ActivityLogRepository } from "src/infrastructure/di/repositories";
import { ActivityAction } from "src/entities/models/ActivityLog";
import { logger } from "@/app/lib/logger";

export async function logActivity(
  action: ActivityAction,
  entity_type: string,
  entity_id: string,
  description: string,
): Promise<void> {
  try {
    const ctx = RequestContext.getStore();
    if (!ctx?.username || !ctx?.branch_id || !ctx?.branch_name) return;

    await ActivityLogRepository.createActivityLog({
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
