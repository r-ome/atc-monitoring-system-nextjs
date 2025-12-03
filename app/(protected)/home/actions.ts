"use server";

import { GetBidderBirthdatesController } from "src/controllers/statistics/get-bidder-birthdates.controller";

export const getBidderBirthdates = async () => {
  return GetBidderBirthdatesController();
};
