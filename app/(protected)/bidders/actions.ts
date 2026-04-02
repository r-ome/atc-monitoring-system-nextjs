"use server";

import { CreateBidderController } from "src/controllers/bidders/create-bidder.controller";
import { UpdateBidderController } from "src/controllers/bidders/update-bidder.controller";
import { GetBiddersController } from "src/controllers/bidders/get-bidders.controller";
import { GetBidderByBidderNumberController } from "src/controllers/bidders/get-bidder-by-bidder-number.controller";
import { UploadBiddersController } from "src/controllers/bidders/upload-bidders.controller";
import { CreateBidderRequirementController } from "src/controllers/bidder-requirement/create-bidder-requirement.controller";
import { UpdateBidderRequirementController } from "src/controllers/bidder-requirement/update-bidder-requirement.controller";
import { DeleteBidderRequirementController } from "src/controllers/bidder-requirement/delete-bidder-requirement.controller";
import { CreateBanHistoryController } from "src/controllers/bidder-ban-history/create-ban-history.controller";
import { DeleteBanHistoryController } from "src/controllers/bidder-ban-history/delete-ban-history.controller";
import {
  authorizeAction,
  runWithBranchContext,
  runWithUserContext,
} from "@/app/lib/protected-action";

export const createBidder = async (formData: FormData) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(formData.entries());
  data.branch_id = data.branch_id ? data.branch_id : auth.value.branch.branch_id;

  return await runWithUserContext(
    auth.value,
    async () => await CreateBidderController(data),
  );
};

export const getBidderByBidderNumber = async (bidderNumber: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const decoded_url = decodeURI(bidderNumber).split("-");
  const bidder_number = decoded_url[0];
  const branch_name = decoded_url[1];
  return await runWithBranchContext(auth.value, async () =>
    GetBidderByBidderNumberController(bidder_number, branch_name),
  );
};

export const getBidders = async () => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(
    auth.value,
    async () => await GetBiddersController(),
  );
};

export const updateBidder = async (bidder_id: string, formData: FormData) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(formData.entries());
  data.branch_id = data.branch_id ? data.branch_id : auth.value.branch.branch_id;

  return await runWithUserContext(
    auth.value,
    async () => await UpdateBidderController(bidder_id, data),
  );
};

export const uploadBidders = async (formData: FormData) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const branch_id = formData.get("branch_id") as string;
  const file = formData.get("file");

  return await runWithUserContext(
    auth.value,
    async () => await UploadBiddersController(branch_id, file as File),
  );
};

export const createBidderRequirement = async (
  bidder_id: string,
  formData: FormData,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(formData.entries());

  return await runWithUserContext(
    auth.value,
    async () => await CreateBidderRequirementController(bidder_id, data),
  );
};

export const updateBidderRequirement = async (
  requirement_id: string,
  formData: FormData,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(formData.entries());

  return await runWithUserContext(
    auth.value,
    async () => await UpdateBidderRequirementController(requirement_id, data),
  );
};

export const deleteBidderRequirement = async (requirement_id: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await DeleteBidderRequirementController(requirement_id),
  );
};

export const createBanHistory = async (
  bidder_id: string,
  formData: FormData,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(formData.entries());

  return await runWithUserContext(
    auth.value,
    async () => await CreateBanHistoryController(bidder_id, data),
  );
};

export const deleteBanHistory = async (bidder_ban_history_id: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await DeleteBanHistoryController(bidder_ban_history_id),
  );
};
