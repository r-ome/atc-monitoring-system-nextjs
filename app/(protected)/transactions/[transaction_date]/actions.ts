"use server";

import {
  authorizeAction,
  runWithBranchContext,
  runWithUserContext,
} from "@/app/lib/protected-action";
import { LogCashFlowReportController } from "src/controllers/reports/log-cash-flow-report.controller";
import { GetPaymentUpdateLogsController } from "src/controllers/activity-logs/get-payment-update-logs.controller";

export const getPaymentUpdateLogs = async (
  payment_ids: string[],
  branch_id?: string,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(
    auth.value,
    async () => await GetPaymentUpdateLogsController(payment_ids, branch_id),
  );
};

export const logCashFlowReport = async (input: Record<string, unknown>) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await LogCashFlowReportController(input),
  );
};
