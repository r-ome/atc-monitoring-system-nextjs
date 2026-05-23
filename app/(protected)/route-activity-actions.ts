"use server";

import { logActivity } from "@/app/lib/log-activity";
import { getActivityRouteView } from "@/app/lib/activity-route-registry";
import { requireUser } from "@/app/lib/auth";
import { runWithUserContext } from "@/app/lib/protected-action";

export const logRouteView = async (pathname: unknown) => {
  if (typeof pathname !== "string") return;

  const routeView = getActivityRouteView(pathname);
  if (!routeView) return;

  const user = await requireUser();

  await runWithUserContext(user, async () => {
    await logActivity(
      "CREATE",
      "route_view",
      routeView.entity_id,
      routeView.description,
    );
  });
};
