import { AuctionRepository } from "src/infrastructure/di/repositories";
import { InputParseError, NotFoundError } from "src/entities/errors/common";

export const unregisterBidderUseCase = async (auction_bidder_id: string) => {
  const registered_bidder = await AuctionRepository.getRegisteredBidderById(auction_bidder_id);
  if (!registered_bidder) {
    throw new NotFoundError("AUCTION BIDDER NOT FOUND!");
  }

  if (registered_bidder?.auctions_inventories.length) {
    throw new InputParseError("Cannot Unregister Bidder!", {
      cause: { bidder: ["Bidder already have items in auction!"] },
    });
  }

  await AuctionRepository.unregisterBidder(auction_bidder_id);

  return {
    auction_bidder_id,
    bidder_number: registered_bidder.bidder.bidder_number,
  };
};
