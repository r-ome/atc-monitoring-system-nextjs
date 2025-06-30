"use server";

import { CreateBidderController } from "src/controllers/bidders/create-bidders.controller";
import { UpdateBidderController } from "src/controllers/bidders/update-bidder.controller";
import { getBiddersController } from "src/controllers/bidders/get-bidders.controller";
import { getBidderByBidderNumberController } from "src/controllers/bidders/get-bidder-by-bidder-number.controller";

export const createBidder = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  return await CreateBidderController(data);
};

export const getBidderByBidderNumber = async (bidderNumber: string) => {
  return await getBidderByBidderNumberController(bidderNumber);
};

export const getBidders = async () => {
  return await getBiddersController();
};

export const updateBidder = async (bidder_id: string, formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  return await UpdateBidderController(bidder_id, data);
};
