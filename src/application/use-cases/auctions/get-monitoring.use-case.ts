import { AUCTION_ITEM_STATUS } from "src/entities/models/Auction";
import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const getMonitoringUseCase = async (
  auction_id: string,
  status: AUCTION_ITEM_STATUS[] = []
) => {
  return await AuctionRepository.getMonitoring(auction_id, status);
};
