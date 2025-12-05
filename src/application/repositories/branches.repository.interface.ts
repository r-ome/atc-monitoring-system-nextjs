import {
  BranchInsertSchema,
  BranchSchema,
  BranchWithBiddersSchema,
} from "src/entities/models/Branch";

export interface IBranchRepository {
  getBranch(branch_id: string): Promise<BranchSchema | null>;
  getBranchWithBidders(branch_id: string): Promise<BranchWithBiddersSchema>;
  getBranchByName(name: string): Promise<BranchSchema | null>;
  getBranches(): Promise<BranchSchema[]>;
  createBranch(name: BranchInsertSchema): Promise<BranchSchema>;
  updateBranch: (
    branch_id: string,
    input: BranchInsertSchema
  ) => Promise<BranchSchema>;
}
