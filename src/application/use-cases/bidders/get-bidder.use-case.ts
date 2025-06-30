import { BidderRepository } from "src/infrastructure/repositories/bidders.repository";

export const getBidderUseCase = async (bidder_id: string) => {
  return await BidderRepository.getBidder(bidder_id);
};
