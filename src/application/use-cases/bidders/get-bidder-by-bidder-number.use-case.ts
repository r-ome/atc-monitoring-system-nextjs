import { BidderRepository } from "src/infrastructure/repositories/bidders.repository";

export const getBidderByBidderNumberUseCase = async (
  bidder_number: string,
  branch_name: string
) => {
  const bidder = await BidderRepository.getBidderByBidderNumber(
    bidder_number,
    branch_name
  );

  return bidder;
};
