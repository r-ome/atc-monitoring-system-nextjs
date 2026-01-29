import { IReportsRepository } from "src/application/repositories/reports.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { DatabaseOperationError } from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";

export const ReportsRepository: IReportsRepository = {
  getTotalSales: async (branch_id, date) => {
    try {
      const [year, month] = date.split("-").map(Number);
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);

      return await prisma.auctions.findMany({
        include: {
          branch: true,
          registered_bidders: {
            include: { auctions_inventories: true },
          },
        },
        where: { branch_id, created_at: { gte: start, lt: end } },
        orderBy: { created_at: "asc" },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting branch", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getTotalExpenses: async (branch_id, date) => {
    try {
      const [year, month] = date.split("-").map(Number);
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);

      const expenses = await prisma.expenses.findMany({
        include: { branch: true },
        where: { branch_id, created_at: { gte: start, lt: end } },
      });

      return expenses;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting branch", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
