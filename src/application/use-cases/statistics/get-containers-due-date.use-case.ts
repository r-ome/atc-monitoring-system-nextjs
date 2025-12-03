import { StatisticsRepository } from "src/infrastructure/repositories/statistics.repository";

export const getContainersDueDate = async () => {
  return StatisticsRepository.getContainersDueDate();
};
