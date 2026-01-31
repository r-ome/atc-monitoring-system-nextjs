import prisma from "@/app/lib/prisma/prisma";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IExpenseRepository } from "src/application/repositories/expenses.repository.interface";
import { DatabaseOperationError } from "src/entities/errors/common";
import { computePettyCashUseCase } from "../../application/use-cases/expenses/compute-petty-cash.use-case";
import { fromZonedTime } from "date-fns-tz";
import { formatDate } from "@/app/lib/utils";
const TZ = "Asia/Manila";

export const ExpensesRepository: IExpenseRepository = {
  getExpensesByDate: async (date, branch_id) => {
    try {
      const startOfDay = fromZonedTime(`${date} 00:00:00.000`, TZ);
      const endOfDay = fromZonedTime(`${date} 23:59:59.999`, TZ);

      const expenses = await prisma.expenses.findMany({
        include: { branch: true },
        where: {
          created_at: { gte: startOfDay, lte: endOfDay },
          ...(branch_id ? { branch_id } : {}),
        },
        orderBy: { created_at: "desc" },
      });

      return expenses;
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
      const startOfDay = fromZonedTime(`${date} 00:00:00.000`, TZ);
      const endOfDay = fromZonedTime(`${date} 23:59:59.999`, TZ);

      let petty_cash = await prisma.petty_cash.findFirst({
        include: { branch: true },
        where: {
          branch_id,
          created_at: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { created_at: "desc" },
      });

      if (!petty_cash) {
        petty_cash = await prisma.petty_cash.findFirst({
          include: { branch: true },
          where: {
            branch_id,
            created_at: { lt: startOfDay },
          },
          orderBy: { created_at: "desc" },
        });
      }

      return petty_cash;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting petty cash", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  addExpense: async (petty_cash_id, input) => {
    try {
      return await prisma.$transaction(async (tx) => {
        // create expense
        const created = await tx.expenses.create({
          include: { branch: true },
          data: {
            amount: input.amount,
            purpose: input.purpose,
            remarks: input.remarks,
            created_at: input.created_at,
            ...(input.branch_id ? { branch_id: input.branch_id } : {}),
          },
        });

        // update petty_cash
        await computePettyCashUseCase(tx, petty_cash_id, input);
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

        const petty_cash = await ExpensesRepository.getPettyCashBalance(
          formatDate(updated_expense.created_at, "yyyy-MM-dd"),
          updated_expense.branch_id,
        );

        if (!petty_cash) throw new Error("No Petty Cash");

        await computePettyCashUseCase(tx, petty_cash?.petty_cash_id, {
          created_at: updated_expense.created_at,
          branch_id: updated_expense.branch_id,
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
        update: { amount: data.amount, remarks: data.remarks || "" },
        create: {
          amount: data.amount,
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
  deleteExpense: async (expense_id) => {
    try {
      await prisma.$transaction(async (tx) => {
        const expense = await tx.expenses.findFirst({ where: { expense_id } });

        if (!expense)
          throw new DatabaseOperationError("Expense does not exist!");

        const petty_cash = await ExpensesRepository.getPettyCashBalance(
          formatDate(expense.created_at, "yyyy-MM-dd"),
          expense.branch_id,
        );

        if (!petty_cash) throw new Error("No Petty Cash");

        await tx.petty_cash.update({
          where: { petty_cash_id: petty_cash.petty_cash_id },
          data: {
            amount: {
              ...(expense.purpose === "ADD_PETTY_CASH"
                ? { decrement: expense.amount }
                : { increment: expense.amount }),
            },
          },
        });

        await tx.expenses.delete({ where: { expense_id } });
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
};
