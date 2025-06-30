import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";
import { getAuctionUseCase } from "./get-auction.use-case";
import { NotFoundError } from "src/entities/errors/common";

export async function getRegisteredBidderUseCase(
  bidder_number: string,
  auction_date: Date
) {
  const auction = await getAuctionUseCase(auction_date);
  const registered_bidder = await AuctionRepository.getRegisteredBidder(
    bidder_number,
    auction.auction_id
  );

  if (!registered_bidder) {
    throw new NotFoundError("Registered Bidder not found!");
  }

  return registered_bidder;
}
