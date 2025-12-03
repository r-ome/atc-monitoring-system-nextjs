"use server";

import { GetBidderBirthdatesController } from "src/controllers/statistics/get-bidder-birthdates.controller";
import { GetContainersDueDateController } from "src/controllers/statistics/get-containers-due-date.controller";
import { GetUnpaidBiddersController } from "src/controllers/statistics/get-unpaid-bidders.controller";

export const getBidderBirthdates = async () => {
  return GetBidderBirthdatesController();
};

export const getContainersDueDate = async () => {
  return GetContainersDueDateController();
};

export const getUnpaidBidders = async () => {
  return GetUnpaidBiddersController();
};
