"use server";

import { CreateBidderController } from "src/controllers/bidders/create-bidders.controller";
import { UpdateBidderController } from "src/controllers/bidders/update-bidder.controller";
import { GetBiddersController } from "src/controllers/bidders/get-bidders.controller";
import { GetBidderByBidderNumberController } from "src/controllers/bidders/get-bidder-by-bidder-number.controller";
import { getServerSession } from "next-auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { authOptions } from "@/app/lib/auth";

export const createBidder = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  return await CreateBidderController(data);
};

export const getBidderByBidderNumber = async (bidderNumber: string) => {
  return await GetBidderByBidderNumberController(bidderNumber);
};

export const getBidders = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return await RequestContext.run(
    { branch_id: user?.branch?.branch_id ?? null },
    async () => await GetBiddersController()
  );
};

export const updateBidder = async (bidder_id: string, formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  return await UpdateBidderController(bidder_id, data);
};
