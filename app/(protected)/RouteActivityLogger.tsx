"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logRouteView } from "./route-activity-actions";

const ROUTE_VIEW_DEDUPE_MS = 30_000;

export function RouteActivityLogger() {
  const pathname = usePathname();
  const lastLogged = useRef<{ pathname: string; at: number } | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const now = Date.now();
    if (
      lastLogged.current &&
      lastLogged.current.pathname === pathname &&
      now - lastLogged.current.at < ROUTE_VIEW_DEDUPE_MS
    ) {
      return;
    }

    lastLogged.current = { pathname, at: now };
    void logRouteView(pathname);
  }, [pathname]);

  return null;
}
