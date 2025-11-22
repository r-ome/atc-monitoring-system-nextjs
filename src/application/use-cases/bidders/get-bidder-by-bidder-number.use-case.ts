import { NotFoundError } from "src/entities/errors/common";
import { BidderRepository } from "src/infrastructure/repositories/bidders.repository";

export const getBidderByBidderNumberUseCase = async (
  bidder_number: string,
  branch_id: string
) => {
  const bidder = await BidderRepository.getBidderByBidderNumber(
    bidder_number,
    branch_id
  );

  if (!bidder) {
    throw new NotFoundError("Bidder Not Found");
  }

  return bidder;
};
