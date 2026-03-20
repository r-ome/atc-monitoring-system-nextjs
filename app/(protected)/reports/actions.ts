"use server";

import { requireUser } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { GetTotalExpensesController } from "src/controllers/reports/get-total-expenses.controller";
import { GetTotalSalesController } from "src/controllers/reports/get-total-sales.controller";
import { GetPaymentMethodBreakdownController } from "src/controllers/reports/get-payment-method-breakdown.controller";
import { GetCashFlowController } from "src/controllers/reports/get-daily-cash-flow.controller";
import { GetUnpaidBiddersController } from "src/controllers/reports/get-unpaid-bidders.controller";
import { GetBidderActivityController } from "src/controllers/reports/get-bidder-activity.controller";
import { GetTopBiddersController } from "src/controllers/reports/get-top-bidders.controller";
import { GetSellThroughController } from "src/controllers/reports/get-sell-through.controller";
import { GetRefundCancellationController } from "src/controllers/reports/get-refund-cancellation.controller";
import { FilterMode } from "src/entities/models/Report";

async function withContext<T>(fn: () => Promise<T>): Promise<T> {
  const user = await requireUser();
  return RequestContext.run(
    { branch_id: user.branch.branch_id, username: user.username ?? "", branch_name: user.branch.name ?? "" },
    fn,
  );
}

export const getTotalSales = async (branch_id: string, date: string, mode: FilterMode) =>
  withContext(() => GetTotalSalesController(branch_id, date, mode));

export const getTotalExpenses = async (branch_id: string, date: string, mode: FilterMode) =>
  withContext(() => GetTotalExpensesController(branch_id, date, mode));

export const getPaymentMethodBreakdown = async (branch_id: string, date: string) =>
  withContext(() => GetPaymentMethodBreakdownController(branch_id, date));

export const getCashFlow = async (branch_id: string, date: string, mode: FilterMode) =>
  withContext(() => GetCashFlowController(branch_id, date, mode));

export const getUnpaidBidders = async (branch_id: string, date: string) =>
  withContext(() => GetUnpaidBiddersController(branch_id, date));

export const getBidderActivity = async (branch_id: string, date: string) =>
  withContext(() => GetBidderActivityController(branch_id, date));

export const getTopBidders = async (branch_id: string, date: string) =>
  withContext(() => GetTopBiddersController(branch_id, date));

export const getSellThrough = async (branch_id: string, date: string) =>
  withContext(() => GetSellThroughController(branch_id, date));

export const getRefundCancellation = async (branch_id: string, date: string) =>
  withContext(() => GetRefundCancellationController(branch_id, date));
