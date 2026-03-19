import { AuctionRepository } from "src/infrastructure/di/repositories";
import { NotFoundError } from "src/entities/errors/common";

export async function getRegisteredBidderUseCase(
  bidder_number: string,
  auction_date: Date
) {
  const auction = await AuctionRepository.getAuction(auction_date);
  if (!auction) {
    throw new NotFoundError("Auction not found!");
  }

  const registered_bidder = await AuctionRepository.getRegisteredBidder(
    bidder_number,
    auction.auction_id
  );

  if (!registered_bidder) {
    throw new NotFoundError("Registered Bidder not found!");
  }

  return registered_bidder;
}
