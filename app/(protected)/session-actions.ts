"use server";

import { getRawSession, getValidatedSession } from "@/app/lib/auth";
import { logActivityWithContext } from "@/app/lib/log-activity";
import { shouldRefreshSessionActivity } from "@/app/lib/session-timeout";
import { err, ok } from "src/entities/models/Result";
import { UserRepository } from "src/infrastructure/di/repositories";

export const touchSessionActivity = async () => {
  const auth = await getValidatedSession();

  if (auth.status !== "authenticated") {
    return err({
      message:
        auth.status === "inactive" ? "Session expired" : "Unauthorized",
      cause:
        auth.status === "inactive"
          ? "Your session expired due to inactivity."
          : "Session not found.",
    });
  }

  const now = new Date();
  const lastActivityAt = auth.session.user.lastActivityAt ?? null;

  if (!shouldRefreshSessionActivity(lastActivityAt, now.getTime())) {
    return ok({
      lastActivityAt,
    });
  }

  const user = await UserRepository.updateLastActivity(auth.session.user.id, now);

  return ok({
    lastActivityAt: user.last_activity_at?.toISOString() ?? now.toISOString(),
  });
};

export const logSessionLogout = async (
  reason: "manual" | "inactive",
) => {
  const session = await getRawSession();

  if (!session?.user?.id || !session.user.username || !session.user.branch) {
    return;
  }

  const description =
    reason === "inactive"
      ? `Logged out due to inactivity as ${session.user.username}`
      : `Logged out as ${session.user.username}`;

  await logActivityWithContext({
    username: session.user.username,
    branch_id: session.user.branch.branch_id,
    branch_name: session.user.branch.name,
    action: "DELETE",
    entity_type: "session",
    entity_id: session.user.id,
    description,
  });
};
