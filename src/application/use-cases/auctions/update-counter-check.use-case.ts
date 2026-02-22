import { UpdateCounterCheckInput } from "src/entities/models/CounterCheck";
import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";

export const updateCounterCheckUseCase = async (
  counter_check_id: string,
  data: UpdateCounterCheckInput,
) => {
  return await AuctionRepository.updateCounterCheck(counter_check_id, data);
};
