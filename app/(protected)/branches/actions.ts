"use server";

import {
  authorizeAction,
  runWithBranchContext,
  runWithUserContext,
} from "@/app/lib/protected-action";
import { CreateBranchController } from "src/controllers/branches/create-branch.controller";
import { GetBranchesController } from "src/controllers/branches/get-branches.controller";
import { UpdateBranchController } from "src/controllers/branches/update-branch.controller";

export const createBranch = async (formData: FormData) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN"],
  });
  if (!auth.ok) return auth;

  const data = Object.fromEntries(formData.entries());
  return await runWithUserContext(auth.value, async () =>
    CreateBranchController(data),
  );
};

export const getBranches = async () => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    GetBranchesController(),
  );
};

export const updateBranch = async (branch_id: string, formData: FormData) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN"],
  });
  if (!auth.ok) return auth;

  const data = Object.fromEntries(formData.entries());
  return await runWithUserContext(auth.value, async () =>
    UpdateBranchController(branch_id, data),
  );
};
