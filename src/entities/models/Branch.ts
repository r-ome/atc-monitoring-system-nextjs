import { Prisma } from "@prisma/client";
import { z } from "zod";

export type BranchRow = Prisma.branchesGetPayload<object>;
export type BranchWithBiddersRow = Prisma.branchesGetPayload<{
  include: { bidders: true };
}>;

export const createBranchSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).trim(),
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).trim(),
});
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

export type Branch = {
  branch_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
