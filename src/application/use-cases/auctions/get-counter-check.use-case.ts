import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const getCounterCheckRecordsUseCase = async (auction_id: string) => {
  return AuctionRepository.getCounterCheckRecords(auction_id);
};
