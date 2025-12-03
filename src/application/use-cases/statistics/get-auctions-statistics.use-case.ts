import { StatisticsRepository } from "src/infrastructure/repositories/statistics.repository";

export const getAuctionsStatisticsUseCase = async () => {
  return StatisticsRepository.getAuctionsStatistics();
};
