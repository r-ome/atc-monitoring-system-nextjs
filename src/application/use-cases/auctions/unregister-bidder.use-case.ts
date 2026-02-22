import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";
import { getRegisteredBidderById } from "./get-registered-bidder-by-id.use-case";
import { InputParseError } from "src/entities/errors/common";

export const unregisterBidderUseCase = async (auction_bidder_id: string) => {
  const registered_bidder = await getRegisteredBidderById(auction_bidder_id);
  if (registered_bidder?.auctions_inventories.length) {
    throw new InputParseError("Cannot Unregister Bidder!", {
      cause: { bidder: ["Bidder already have items in auction!"] },
    });
  }

  return await AuctionRepository.unregisterBidder(auction_bidder_id);
};
