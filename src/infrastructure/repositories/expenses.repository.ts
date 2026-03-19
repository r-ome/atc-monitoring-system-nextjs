import prisma from "@/app/lib/prisma/prisma";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IExpenseRepository } from "src/application/repositories/expenses.repository.interface";
import { DatabaseOperationError } from "src/entities/errors/common";
import { formatDate } from "@/app/lib/utils";
import { fromZonedTime } from "date-fns-tz";
import { subDays } from "date-fns";
const TZ = "Asia/Manila";

type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

async function computePettyCash(
  tx: PrismaTransactionClient,
  petty_cash_id: string,
  input: { created_at: string; branch_id: string },
) {
  const dateStr = formatDate(new Date(input.created_at), "yyyy-MM-dd");
  const startOfDay = fromZonedTime(`${dateStr} 00:00:00.000`, TZ);
  const endOfDay = fromZonedTime(`${dateStr} 23:59:59.999`, TZ);

  const yesterdayStr = formatDate(
    subDays(new Date(input.created_at), 1),
    "yyyy-MM-dd",
  );
  const yesterdayStart = fromZonedTime(`${yesterdayStr} 00:00:00.000`, TZ);
  const yesterdayEnd = fromZonedTime(`${yesterdayStr} 23:59:59.999`, TZ);

  let last_petty_cash = await tx.petty_cash.findFirst({
    where: {
      branch_id: input.branch_id,
      created_at: { gte: yesterdayStart, lte: yesterdayEnd },
    },
    orderBy: { created_at: "desc" },
  });

  if (!last_petty_cash) {
    last_petty_cash = await tx.petty_cash.findFirst({
      where: {
        branch_id: input.branch_id,
        created_at: { lt: yesterdayStart },
      },
      orderBy: { created_at: "desc" },
    });
  }

  const today_petty_cash = await tx.expenses.findMany({
    where: {
      branch_id: input.branch_id,
      created_at: { gte: startOfDay, lte: endOfDay },
      purpose: "ADD_PETTY_CASH",
    },
  });
  const total_today_petty_cash = today_petty_cash.reduce((acc, item) => {
    acc += item.amount.toNumber();
    return acc;
  }, 0);

  const expenses = await tx.expenses.findMany({
    where: {
      branch_id: input.branch_id,
      created_at: { gte: startOfDay, lte: endOfDay },
      purpose: "EXPENSE",
    },
  });
  const total_expenses = expenses.reduce((acc, item) => {
    acc += item.amount.toNumber();
    return acc;
  }, 0);

  const cash_on_hand =
    (last_petty_cash ? last_petty_cash.amount.toNumber() : 0) +
    total_today_petty_cash -
    total_expenses;

  await tx.petty_cash.upsert({
    where: { petty_cash_id },
    update: {
      amount: cash_on_hand,
      remarks: "updated petty cash amount",
    },
    create: {
      amount: cash_on_hand,
      remarks: "created petty cash",
      created_at: fromZonedTime(input.created_at, TZ),
      branch_id: input.branch_id,
    },
  });
}

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
            created_at: fromZonedTime(input.created_at, TZ),
            ...(input.branch_id ? { branch_id: input.branch_id } : {}),
          },
        });

        // update petty_cash
        await computePettyCash(tx, petty_cash_id, input);
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

        const formatted_created_at = formatDate(
          updated_expense.created_at,
          "yyyy-MM-dd",
        );

        const petty_cash = await ExpensesRepository.getPettyCashBalance(
          formatted_created_at,
          updated_expense.branch_id,
        );

        if (!petty_cash) throw new Error("No Petty Cash");

        await computePettyCash(tx, petty_cash?.petty_cash_id, {
          created_at: formatted_created_at,
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
  recalculatePettyCash: async (petty_cash) => {
    try {
      await prisma.$transaction(async (tx) => {
        await computePettyCash(tx, petty_cash.petty_cash_id, {
          created_at: `${formatDate(new Date(petty_cash.created_at), "yyyy-MM-dd")} 00:00:00.000`,
          branch_id: petty_cash.branch.branch_id,
        });
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error recalculating petty cash!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
