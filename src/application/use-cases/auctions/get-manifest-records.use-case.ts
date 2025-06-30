import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const getManifestRecordsUseCase = async (auction_id: string) => {
  return AuctionRepository.getManifestRecords(auction_id);
};
