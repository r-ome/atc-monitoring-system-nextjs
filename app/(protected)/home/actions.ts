"use server";

import { requireUser } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { GetAuctionsStatisticsController } from "src/controllers/statistics/get-auction-statistics.controller";
import { GetBidderBirthdatesController } from "src/controllers/statistics/get-bidder-birthdates.controller";
import { GetContainersDueDateController } from "src/controllers/statistics/get-containers-due-date.controller";
import { GetUnpaidBiddersController } from "src/controllers/statistics/get-unpaid-bidders.controller";
import { GetUnpaidBidderBalanceSummaryController } from "src/controllers/statistics/get-unpaid-bidder-balance-summary.controller";
import { GetBannedBiddersController } from "src/controllers/statistics/get-banned-bidders.controller";
import { GetHomeCalendarEventsController } from "src/controllers/statistics/get-home-calendar-events.controller";
import type { UserRole } from "src/entities/models/User";

const PRIVILEGED_BALANCE_ROLES = new Set<UserRole>([
  "OWNER",
  "SUPER_ADMIN",
]);

export const getBidderBirthdates = async () => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetBidderBirthdatesController(),
  );
};

export const getContainersDueDate = async () => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetContainersDueDateController(),
  );
};

export const getUnpaidBidders = async () => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetUnpaidBiddersController(),
  );
};

export const getUnpaidBidderBalanceSummary = async () => {
  const user = await requireUser();

  const result = await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetUnpaidBidderBalanceSummaryController(),
  );

  if (!result.ok || PRIVILEGED_BALANCE_ROLES.has(user.role)) {
    return result;
  }

  const branches = result.value.branches.filter(
    (branch) => branch.branch_id === user.branch.branch_id,
  );

  return {
    ok: true as const,
    value: {
      branches,
      total_balance: branches.reduce(
        (sum, branch) => sum + branch.total_balance,
        0,
      ),
    },
  };
};

export const getAuctionsStatistics = async () => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetAuctionsStatisticsController(),
  );
};

export const getBannedBidders = async () => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetBannedBiddersController(),
  );
};

export const getHomeCalendarEvents = async () => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetHomeCalendarEventsController(),
  );
};
