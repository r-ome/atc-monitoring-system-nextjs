import { Prisma } from "@prisma/client";
import { z } from "zod";

export type BranchSchema = Prisma.branchesGetPayload<object>;
export type BranchWithBiddersSchema = Prisma.branchesGetPayload<{
  include: { bidders: true };
}>;
export type Branch = {
  branch_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export const BranchInsertSchema = z.object({
  name: z.string(),
});

export type BranchInsertSchema = z.infer<typeof BranchInsertSchema>;
