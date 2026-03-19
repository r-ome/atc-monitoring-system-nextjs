import type {
  BidderRequirementRow,
  CreateBidderRequirementInput,
  UpdateBidderRequirementInput,
} from "src/entities/models/BidderRequirement";

export interface IBidderRequirementRepository {
  create(
    bidder_id: string,
    input: CreateBidderRequirementInput,
  ): Promise<BidderRequirementRow>;
  update(
    requirement_id: string,
    input: UpdateBidderRequirementInput,
  ): Promise<BidderRequirementRow>;
  delete(requirement_id: string): Promise<void>;
}
