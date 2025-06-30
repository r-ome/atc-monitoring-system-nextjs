import { BranchInsertSchema, BranchSchema } from "src/entities/models/Branch";

export interface IBranchRepository {
  getBranch(branchId: string): Promise<BranchSchema | null>;
  getBranchByName(name: string): Promise<BranchSchema | null>;
  getBranches(): Promise<BranchSchema[]>;
  createBranch(name: BranchInsertSchema): Promise<BranchSchema>;
  updateBranch: (
    branch_id: string,
    input: BranchInsertSchema
  ) => Promise<BranchSchema>;
}
