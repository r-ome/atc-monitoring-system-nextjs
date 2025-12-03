import { StatisticsRepository } from "src/infrastructure/repositories/statistics.repository";

export const getUnpaidBiddersUseCase = async () => {
  return StatisticsRepository.getUnpaidBidders();
};
