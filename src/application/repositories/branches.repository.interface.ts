import {
  BranchRow,
  BranchWithBiddersRow,
  CreateBranchInput,
} from "src/entities/models/Branch";

export interface IBranchRepository {
  getBranch(branch_id: string): Promise<BranchRow | null>;
  getBranchWithBidders(branch_id: string): Promise<BranchWithBiddersRow>;
  getBranchByName(name: string): Promise<BranchRow | null>;
  getBranches(): Promise<BranchRow[]>;
  createBranch(input: CreateBranchInput): Promise<BranchRow>;
  updateBranch: (
    branch_id: string,
    input: CreateBranchInput,
  ) => Promise<BranchRow>;
}
