"use server";

import { requireUser } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { GetExpensesSummaryController } from "src/controllers/reports/get-expenses-summary.controller";

export const getExpensesSummary = async (
  branch_id: string,
  date: string,
) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetExpensesSummaryController(branch_id, date),
  );
};
