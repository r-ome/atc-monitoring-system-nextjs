import prisma from "@/app/lib/prisma/prisma";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IExpenseRepository } from "src/application/repositories/expenses.repository.interface";
import { DatabaseOperationError } from "src/entities/errors/common";

export const ExpensesRepository: IExpenseRepository = {
  getExpensesByDate: async (date) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const expenses = await prisma.expenses.findMany({
        where: { created_at: { gte: startOfDay, lte: endOfDay } },
        orderBy: { created_at: "desc" },
      });

      return { expenses };
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting expenses", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  addExpense: async (input) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const latest_balance = (await tx.expenses.findFirst({
          select: { balance: true },
          orderBy: { created_at: "desc" },
        })) || { balance: 0 };

        const created = await tx.expenses.create({
          data: {
            balance:
              input.purpose === "EXPENSE"
                ? latest_balance.balance - input.amount
                : latest_balance.balance + input.amount,
            amount: input.amount,
            purpose: input.purpose,
            remarks: input.remarks,
            created_at: input.created_at,
          },
        });

        return created;
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error adding expense", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getPettyCashBalance: async (date: Date) => {
    try {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const petty_cash_balance = await prisma.expenses.findFirst({
        where: { created_at: { lte: nextDay } },
        orderBy: { created_at: "desc" },
      });

      return petty_cash_balance;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error adding expense", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
