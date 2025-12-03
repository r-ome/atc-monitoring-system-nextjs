import { StatisticsRepository } from "src/infrastructure/repositories/statistics.repository";

export const getContainersDueDateUseCase = async () => {
  return StatisticsRepository.getContainersDueDate();
};
