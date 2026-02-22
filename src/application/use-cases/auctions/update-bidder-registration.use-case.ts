import { UpdateBidderRegistrationInput } from "src/entities/models/Bidder";
import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const updateBidderRegistrationUseCase = async (
  auction_bidder_id: string,
  data: UpdateBidderRegistrationInput,
) => {
  return await AuctionRepository.updateBidderRegistration(
    auction_bidder_id,
    data
  );
};
