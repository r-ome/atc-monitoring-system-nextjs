import { NotFoundError } from "src/entities/errors/common";
import { BidderRepository } from "src/infrastructure/repositories/bidders.repository";

export const getBidderByBidderNumberUseCase = async (bidderNumber: string) => {
  const bidder = await BidderRepository.getBidderByBidderNumber(bidderNumber);

  if (!bidder) {
    throw new NotFoundError("Bidder Not Found");
  }

  return bidder;
};
