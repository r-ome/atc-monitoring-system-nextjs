import { StatisticsRepository } from "src/infrastructure/repositories/statistics.repository";

export const getBidderBirthdates = async () => {
  return await StatisticsRepository.getBidderBirthdates();
};
