"use server";

import { CreateBidderController } from "src/controllers/bidders/create-bidders.controller";
import { UpdateBidderController } from "src/controllers/bidders/update-bidder.controller";
import { GetBiddersController } from "src/controllers/bidders/get-bidders.controller";
import { GetBidderByBidderNumberController } from "src/controllers/bidders/get-bidder-by-bidder-number.controller";
import { getServerSession } from "next-auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";

export const createBidder = async (formData: FormData) => {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user) redirect("/login");
  const data = Object.fromEntries(formData.entries());
  data.branch_id = data.branch_id ? data.branch_id : user.branch.branch_id;

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await CreateBidderController(data)
  );
};

export const getBidderByBidderNumber = async (bidderNumber: string) => {
  const decoded_url = decodeURI(bidderNumber).split("-");
  const bidder_number = decoded_url[0];
  const branch_name = decoded_url[1];
  return await GetBidderByBidderNumberController(bidder_number, branch_name);
};

export const getBidders = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) redirect("/login");

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetBiddersController()
  );
};

export const updateBidder = async (bidder_id: string, formData: FormData) => {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user) redirect("/login");

  const data = Object.fromEntries(formData.entries());
  data.branch_id = data.branch_id ? data.branch_id : user.branch.branch_id;

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await UpdateBidderController(bidder_id, data)
  );
};
