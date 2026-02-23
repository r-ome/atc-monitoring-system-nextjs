"use server";

import { requireUser } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { GetTotalExpensesController } from "src/controllers/reports/get-total-expenses.controller";
import { GetTotalSalesController } from "src/controllers/reports/get-total-sales.controller";

export const getTotalSales = async (branch_id: string, date: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id, username: user.username ?? "", branch_name: user.branch.name ?? "" },
    async () => await GetTotalSalesController(branch_id, date),
  );
};

export const getTotalExpenses = async (branch_id: string, date: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id, username: user.username ?? "", branch_name: user.branch.name ?? "" },
    async () => await GetTotalExpensesController(branch_id, date),
  );
};
