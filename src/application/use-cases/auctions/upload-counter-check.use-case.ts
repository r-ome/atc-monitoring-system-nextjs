import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";
import { CounterCheckRecord } from "src/entities/models/CounterCheck";

export const uploadCounterCheckUseCase = async (
  auction_id: string,
  data: CounterCheckRecord[]
) => {
  return await AuctionRepository.uploadCounterCheck(auction_id, data);
};
