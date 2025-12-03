"use server";

import { GetBidderBirthdatesController } from "src/controllers/statistics/get-bidder-birthdates.controller";
import { GetContainersDueDate } from "src/controllers/statistics/get-containers-due-date.controller";

export const getBidderBirthdates = async () => {
  return GetBidderBirthdatesController();
};

export const getContainersDueDate = async () => {
  return GetContainersDueDate();
};
