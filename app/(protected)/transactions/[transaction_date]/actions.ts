"use server";

import {
  authorizeAction,
  runWithUserContext,
} from "@/app/lib/protected-action";
import { LogCashFlowReportController } from "src/controllers/reports/log-cash-flow-report.controller";

export const logCashFlowReport = async (input: Record<string, unknown>) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await LogCashFlowReportController(input),
  );
};
