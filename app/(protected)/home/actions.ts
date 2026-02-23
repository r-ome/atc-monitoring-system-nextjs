"use server";

import { requireUser } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { GetAuctionsStatisticsController } from "src/controllers/statistics/get-auction-statistics.controller";
import { GetBidderBirthdatesController } from "src/controllers/statistics/get-bidder-birthdates.controller";
import { GetContainersDueDateController } from "src/controllers/statistics/get-containers-due-date.controller";
import { GetUnpaidBiddersController } from "src/controllers/statistics/get-unpaid-bidders.controller";

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

export const getAuctionsStatistics = async () => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetAuctionsStatisticsController(),
  );
};
