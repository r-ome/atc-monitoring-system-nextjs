import { DatabaseOperationError } from "src/entities/errors/common";
import { getActivityLogsUseCase } from "src/application/use-cases/activity-logs/get-activity-logs.use-case";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { presentActivityLog } from "./present-activity-log";

export const GetActivityLogsController = async (date: string) => {
  try {
    const logs = await getActivityLogsUseCase(date);
    return ok(logs.map(presentActivityLog));
  } catch (error) {
    logger("GetActivityLogsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
