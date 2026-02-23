"use server";

import { CreateBidderController } from "src/controllers/bidders/create-bidder.controller";
import { UpdateBidderController } from "src/controllers/bidders/update-bidder.controller";
import { GetBiddersController } from "src/controllers/bidders/get-bidders.controller";
import { GetBidderByBidderNumberController } from "src/controllers/bidders/get-bidder-by-bidder-number.controller";
import { UploadBiddersController } from "src/controllers/bidders/upload-bidders.controller";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { requireUser } from "@/app/lib/auth";

export const createBidder = async (formData: FormData) => {
  const user = await requireUser();
  const data = Object.fromEntries(formData.entries());
  data.branch_id = data.branch_id ? data.branch_id : user.branch.branch_id;

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => await CreateBidderController(data),
  );
};

export const getBidderByBidderNumber = async (bidderNumber: string) => {
  const decoded_url = decodeURI(bidderNumber).split("-");
  const bidder_number = decoded_url[0];
  const branch_name = decoded_url[1];
  return await GetBidderByBidderNumberController(bidder_number, branch_name);
};

export const getBidders = async () => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetBiddersController(),
  );
};

export const updateBidder = async (bidder_id: string, formData: FormData) => {
  const user = await requireUser();

  const data = Object.fromEntries(formData.entries());
  data.branch_id = data.branch_id ? data.branch_id : user.branch.branch_id;

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => await UpdateBidderController(bidder_id, data),
  );
};

export const uploadBidders = async (formData: FormData) => {
  const user = await requireUser();
  const branch_id = formData.get("branch_id") as string;
  const file = formData.get("file");

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => await UploadBiddersController(branch_id, file as File),
  );
};
