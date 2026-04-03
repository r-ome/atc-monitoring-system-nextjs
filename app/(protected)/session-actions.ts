"use server";

import { getValidatedSession } from "@/app/lib/auth";
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
