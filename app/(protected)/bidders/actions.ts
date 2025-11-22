"use server";

import { CreateBidderController } from "src/controllers/bidders/create-bidders.controller";
import { UpdateBidderController } from "src/controllers/bidders/update-bidder.controller";
import { GetBiddersController } from "src/controllers/bidders/get-bidders.controller";
import { GetBidderByBidderNumberController } from "src/controllers/bidders/get-bidder-by-bidder-number.controller";
import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";

export const createBidder = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  const session = await getServerSession(authOptions);
  if (!session) return;
  const branch_ids = session.user.branches.map(({ branch_id }) => branch_id);
  return await CreateBidderController(data, branch_ids);
};

export const getBidderByBidderNumber = async (
  bidderNumber: string,
  branch_id: string
) => {
  return await GetBidderByBidderNumberController(bidderNumber, branch_id);
};

export const getBidders = async (branch_ids: string[]) => {
  return await GetBiddersController(branch_ids);
};

export const updateBidder = async (bidder_id: string, formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  return await UpdateBidderController(bidder_id, data);
};
