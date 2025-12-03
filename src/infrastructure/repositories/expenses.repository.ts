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
  getPettyCashBalance: async (date: Date) => {
    try {
      /**
       * get the balance of the last transaction less than current date
       */
      const petty_cash_balance = await prisma.expenses.findFirst({
        where: { created_at: { lt: date } },
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
  addExpense: async (input) => {
    try {
      return await prisma.$transaction(async (tx) => {
        let last_balance = 0;
        const last_expense_transaction = await tx.expenses.findFirst({
          where: { created_at: { lt: input.created_at } },
          orderBy: { created_at: "desc" },
        });

        if (last_expense_transaction) {
          last_balance = last_expense_transaction.balance.toNumber();
        }

        const created = await tx.expenses.create({
          data: {
            amount: input.amount,
            purpose: input.purpose,
            balance:
              input.purpose === "ADD_PETTY_CASH"
                ? last_balance + input.amount
                : last_balance - input.amount,
            remarks: input.remarks,
            created_at: input.created_at,
          },
        });

        // throw new Error("woops");
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
  updateExpense: async (expense_id, data) => {
    try {
      const updated = await prisma.expenses.update({
        where: { expense_id },
        data: {
          amount: data.amount,
          remarks: data.remarks,
          purpose: data.purpose as "EXPENSE" | "ADD_PETTY_CASH",
        },
      });

      return updated;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating expense!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
