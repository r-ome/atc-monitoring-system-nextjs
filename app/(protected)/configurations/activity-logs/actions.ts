"use server";

import { requireUser } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { GetActivityLogsController } from "src/controllers/activity-logs/get-activity-logs.controller";

export const getActivityLogs = async (date: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => await GetActivityLogsController(date),
  );
};
