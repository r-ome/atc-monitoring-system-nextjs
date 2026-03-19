"use server";

import { CreateBranchController } from "src/controllers/branches/create-branch.controller";
import { GetBranchesController } from "src/controllers/branches/get-branches.controller";
import { UpdateBranchController } from "src/controllers/branches/update-branch.controller";

export const createBranch = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  return await CreateBranchController(data);
};

export const getBranches = async () => {
  return await GetBranchesController();
};

export const updateBranch = async (branch_id: string, formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  return await UpdateBranchController(branch_id, data);
};
