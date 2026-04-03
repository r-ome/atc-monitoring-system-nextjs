export const SESSION_INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
export const SESSION_WARNING_WINDOW_MS = 5 * 60 * 1000;
export const SESSION_ACTIVITY_THROTTLE_MS = 5 * 60 * 1000;

export function getSessionExpirationTime(lastActivityAt: string | null) {
  if (!lastActivityAt) {
    return 0;
  }

  return new Date(lastActivityAt).getTime() + SESSION_INACTIVITY_TIMEOUT_MS;
}

export function isSessionExpired(
  lastActivityAt: Date | string | null | undefined,
  now = Date.now(),
) {
  if (!lastActivityAt) {
    return true;
  }

  return (
    new Date(lastActivityAt).getTime() + SESSION_INACTIVITY_TIMEOUT_MS <= now
  );
}

export function shouldRefreshSessionActivity(
  lastActivityAt: Date | string | null | undefined,
  now = Date.now(),
) {
  if (!lastActivityAt) {
    return true;
  }

  return (
    now - new Date(lastActivityAt).getTime() >= SESSION_ACTIVITY_THROTTLE_MS
  );
}
