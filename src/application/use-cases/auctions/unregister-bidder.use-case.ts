import { AuctionRepository } from "src/infrastructure/di/repositories";
import { InputParseError } from "src/entities/errors/common";

export const unregisterBidderUseCase = async (auction_bidder_id: string) => {
  const registered_bidder = await AuctionRepository.getRegisteredBidderById(auction_bidder_id);
  if (registered_bidder?.auctions_inventories.length) {
    throw new InputParseError("Cannot Unregister Bidder!", {
      cause: { bidder: ["Bidder already have items in auction!"] },
    });
  }

  return await AuctionRepository.unregisterBidder(auction_bidder_id);
};
