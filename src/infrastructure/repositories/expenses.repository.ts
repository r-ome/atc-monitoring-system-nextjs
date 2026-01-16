import prisma from "@/app/lib/prisma/prisma";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IExpenseRepository } from "src/application/repositories/expenses.repository.interface";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { subDays, isMonday } from "date-fns";

export const ExpensesRepository: IExpenseRepository = {
  getExpensesByDate: async (date, branch_id) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const expenses = await prisma.expenses.findMany({
        include: { branch: true },
        where: {
          created_at: { gte: startOfDay, lte: endOfDay },
          ...(branch_id ? { branch_id } : {}),
        },
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
  getPettyCashBalance: async (date, branch_id) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const petty_cash = await prisma.petty_cash.findFirst({
        include: { branch: true },
        where: {
          created_at: { gte: startOfDay, lte: endOfDay },
          ...(branch_id ? { branch_id } : {}),
        },
        orderBy: { created_at: "desc" },
      });

      return petty_cash;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error adding expense", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  addExpense: async (petty_cash_id, input) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const previous_working_day = isMonday(input.created_at)
          ? subDays(input.created_at, 2)
          : subDays(input.created_at, 1);
        const previous_petty_cash =
          await ExpensesRepository.getPettyCashBalance(
            previous_working_day,
            input.branch_id
          );

        let current_petty_cash = await tx.petty_cash.findFirst({
          where: { petty_cash_id },
        });

        if (!current_petty_cash) {
          current_petty_cash = await tx.petty_cash.create({
            data: {
              balance: previous_petty_cash ? previous_petty_cash.balance : 0,
              remarks: "created petty cash",
              created_at: input.created_at,
              branch_id: input.branch_id,
            },
          });
        }

        // create expense
        const created = await tx.expenses.create({
          include: { branch: true },
          data: {
            amount: input.amount,
            purpose: input.purpose,
            balance:
              input.purpose === "ADD_PETTY_CASH"
                ? current_petty_cash.balance.add(input.amount)
                : current_petty_cash.balance.sub(input.amount),
            remarks: input.remarks,
            created_at: input.created_at,
            ...(input.branch_id ? { branch_id: input.branch_id } : {}),
          },
        });

        // update current_petty_cash balance
        const updated = await tx.petty_cash.update({
          where: { petty_cash_id: current_petty_cash.petty_cash_id },
          data: {
            balance:
              input.purpose === "ADD_PETTY_CASH"
                ? { increment: input.amount }
                : { decrement: input.amount },
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
  updateExpense: async (expense_id, data) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const updated_expense = await tx.expenses.update({
          include: { branch: true },
          where: { expense_id },
          data: {
            amount: data.amount,
            remarks: data.remarks,
            purpose: data.purpose as "EXPENSE" | "ADD_PETTY_CASH",
          },
        });

        // get current petty_cash balance
        const current_petty_cash = await ExpensesRepository.getPettyCashBalance(
          updated_expense.created_at,
          data.branch_id
        );

        if (!current_petty_cash) {
          throw new InputParseError("Add Petty Cash first!", {
            cause: "Petty cash is required!",
          });
        }

        // update current petty_cash balance
        await tx.petty_cash.update({
          where: { petty_cash_id: current_petty_cash.petty_cash_id },
          data: {
            balance:
              data.purpose === "ADD_PETTY_CASH"
                ? { increment: data.amount }
                : { decrement: data.amount },
          },
        });

        return updated_expense;
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating expense!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  updatePettyCash: async (petty_cash_id, data) => {
    try {
      const updated = await prisma.petty_cash.upsert({
        include: { branch: true },
        where: { petty_cash_id },
        update: {
          balance: data.balance,
          remarks: data.remarks || "",
        },
        create: {
          balance: data.balance,
          remarks: data.remarks || "",
          branch_id: data.branch_id,
          created_at: data.created_at,
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
