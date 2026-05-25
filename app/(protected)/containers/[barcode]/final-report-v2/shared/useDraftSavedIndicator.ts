"use client";

import { useEffect, useRef, useState } from "react";

const formatAgo = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
};

export const useDraftSavedIndicator = () => {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [savedError, setSavedError] = useState(false);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (savedAt === null) return;
    intervalRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [savedAt]);

  const markSaved = (ok: boolean) => {
    setSavedAt(Date.now());
    setSavedError(!ok);
  };

  const savedAgo =
    savedAt === null ? null : formatAgo(Date.now() - savedAt + tick * 0);

  return { savedAgo, savedError, markSaved };
};
