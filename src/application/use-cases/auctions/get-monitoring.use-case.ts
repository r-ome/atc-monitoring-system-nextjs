import { AuctionItemStatus } from "src/entities/models/Auction";
import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const getMonitoringUseCase = async (
  auction_id: string,
  status: AuctionItemStatus[] = []
) => {
  return await AuctionRepository.getMonitoring(auction_id, status);
};
