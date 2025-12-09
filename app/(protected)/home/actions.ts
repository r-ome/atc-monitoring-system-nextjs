"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { GetAuctionsStatisticsController } from "src/controllers/statistics/get-auction-statistics.controller";
import { GetBidderBirthdatesController } from "src/controllers/statistics/get-bidder-birthdates.controller";
import { GetContainersDueDateController } from "src/controllers/statistics/get-containers-due-date.controller";
import { GetUnpaidBiddersController } from "src/controllers/statistics/get-unpaid-bidders.controller";

export const getBidderBirthdates = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) redirect("/login");

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetBidderBirthdatesController()
  );
};

export const getContainersDueDate = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) redirect("/login");

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetContainersDueDateController()
  );
};

export const getUnpaidBidders = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) redirect("/login");

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetUnpaidBiddersController()
  );
};

export const getAuctionsStatistics = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) redirect("/login");

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetAuctionsStatisticsController()
  );
};
