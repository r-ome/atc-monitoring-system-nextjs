import prisma from "@/app/lib/prisma/prisma";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IActivityLogRepository } from "src/application/repositories/activity-logs.repository.interface";
import { DatabaseOperationError } from "src/entities/errors/common";
import { fromZonedTime } from "date-fns-tz";

const TZ = "Asia/Manila";

export const ActivityLogRepository: IActivityLogRepository = {
  createActivityLog: async (input) => {
    try {
      return await prisma.activity_logs.create({ data: input });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating activity log", {
          cause: error.message,
        });
      }
      throw error;
    }
  },

  getActivityLogs: async (date) => {
    try {
      const startOfDay = fromZonedTime(`${date} 00:00:00.000`, TZ);
      const endOfDay = fromZonedTime(`${date} 23:59:59.999`, TZ);

      return await prisma.activity_logs.findMany({
        where: {
          created_at: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { created_at: "desc" },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting activity logs", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
};
