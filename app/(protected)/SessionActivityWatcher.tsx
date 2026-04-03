"use client";

import { useCallback, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  getSessionExpirationTime,
  SESSION_ACTIVITY_THROTTLE_MS,
  SESSION_WARNING_WINDOW_MS,
} from "@/app/lib/session-timeout";
import { logSessionLogout, touchSessionActivity } from "./session-actions";

const ACTIVITY_STORAGE_KEY = "atc:last-activity-at";
const LOGOUT_STORAGE_KEY = "atc:inactive-logout-at";
const WARNING_TOAST_ID = "session-inactivity-warning";

type SessionActivityWatcherProps = {
  initialLastActivityAt: string | null;
};

function getLatestIsoTimestamp(currentValue: string | null, nextValue: string) {
  if (!currentValue) {
    return nextValue;
  }

  return new Date(nextValue).getTime() > new Date(currentValue).getTime()
    ? nextValue
    : currentValue;
}

export function SessionActivityWatcher({
  initialLastActivityAt,
}: SessionActivityWatcherProps) {
  const lastActivityAtRef = useRef<string | null>(
    initialLastActivityAt ?? new Date().toISOString(),
  );
  const lastSyncedActivityAtRef = useRef<string | null>(initialLastActivityAt);
  const warningTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);
  const isSyncingRef = useRef(false);
  const isSigningOutRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const clearWarning = useCallback(() => {
    toast.dismiss(WARNING_TOAST_ID);
  }, []);

  const signOutInactiveUser = useCallback(async () => {
    if (isSigningOutRef.current) {
      return;
    }

    isSigningOutRef.current = true;
    clearTimers();
    clearWarning();
    await logSessionLogout("inactive");
    window.localStorage.setItem(LOGOUT_STORAGE_KEY, new Date().toISOString());
    await signOut({ callbackUrl: "/login?reason=inactive" });
  }, [clearTimers, clearWarning]);

  const scheduleTimers = useCallback(() => {
    clearTimers();

    const expirationTime = getSessionExpirationTime(lastActivityAtRef.current);
    if (!expirationTime) {
      return;
    }

    const now = Date.now();
    const warningDelay = Math.max(
      expirationTime - SESSION_WARNING_WINDOW_MS - now,
      0,
    );
    const logoutDelay = Math.max(expirationTime - now, 0);

    warningTimerRef.current = window.setTimeout(() => {
      const minutesRemaining = Math.round(
        SESSION_WARNING_WINDOW_MS / (60 * 1000),
      );

      toast.warning(
        `You will be logged out in ${minutesRemaining} minutes due to inactivity.`,
        {
          id: WARNING_TOAST_ID,
          duration: SESSION_WARNING_WINDOW_MS,
        },
      );
    }, warningDelay);

    logoutTimerRef.current = window.setTimeout(() => {
      void signOutInactiveUser();
    }, logoutDelay);
  }, [clearTimers, signOutInactiveUser]);

  const syncBackendActivity = useCallback(async () => {
    if (isSyncingRef.current || isSigningOutRef.current) {
      return;
    }

    const lastSyncedAt = lastSyncedActivityAtRef.current;
    if (
      lastSyncedAt &&
      Date.now() - new Date(lastSyncedAt).getTime() <
        SESSION_ACTIVITY_THROTTLE_MS
    ) {
      return;
    }

    isSyncingRef.current = true;
    const res = await touchSessionActivity();
    isSyncingRef.current = false;

    if (!res.ok) {
      await signOutInactiveUser();
      return;
    }

    const nextLastActivityAt =
      res.value.lastActivityAt ?? new Date().toISOString();

    lastSyncedActivityAtRef.current = nextLastActivityAt;
    lastActivityAtRef.current = getLatestIsoTimestamp(
      lastActivityAtRef.current,
      nextLastActivityAt,
    );

    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, nextLastActivityAt);
    scheduleTimers();
  }, [scheduleTimers, signOutInactiveUser]);

  const recordActivity = useCallback(() => {
    if (isSigningOutRef.current) {
      return;
    }

    const activityAt = new Date().toISOString();
    lastActivityAtRef.current = activityAt;
    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, activityAt);
    clearWarning();
    scheduleTimers();
    void syncBackendActivity();
  }, [clearWarning, scheduleTimers, syncBackendActivity]);

  useEffect(() => {
    scheduleTimers();

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ];

    for (const eventName of events) {
      window.addEventListener(eventName, recordActivity, { passive: true });
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        recordActivity();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOGOUT_STORAGE_KEY && event.newValue) {
        void signOutInactiveUser();
        return;
      }

      if (event.key === ACTIVITY_STORAGE_KEY && event.newValue) {
        lastActivityAtRef.current = getLatestIsoTimestamp(
          lastActivityAtRef.current,
          event.newValue,
        );
        clearWarning();
        scheduleTimers();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      clearTimers();
      clearWarning();

      for (const eventName of events) {
        window.removeEventListener(eventName, recordActivity);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [clearTimers, clearWarning, recordActivity, scheduleTimers, signOutInactiveUser]);

  return null;
}
