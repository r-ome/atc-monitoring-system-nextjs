import { ActivityLogRepository } from "src/infrastructure/di/repositories";

export const getActivityLogsUseCase = async (date: string) => {
  return ActivityLogRepository.getActivityLogs(date);
};
