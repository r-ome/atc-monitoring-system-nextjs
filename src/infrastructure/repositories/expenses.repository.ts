import prisma from "@/app/lib/prisma/prisma";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IExpenseRepository } from "src/application/repositories/expenses.repository.interface";
import { DatabaseOperationError } from "src/entities/errors/common";
import { ConsistencyIssue, PettyCashSnapshot, RepairResult } from "src/entities/models/Expense";
import { formatDate } from "@/app/lib/utils";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const TZ = "Asia/Manila";

type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

// Recomputes and stores the petty_cash balance for a single day.
// dateStr must be "yyyy-MM-dd" in Manila timezone.
async function computeBalanceForDay(
  tx: PrismaTransactionClient,
  petty_cash_id: string,
  dateStr: string,
  branch_id: string,
) {
  const startOfDay = fromZonedTime(`${dateStr} 00:00:00.000`, TZ);
  const endOfDay = fromZonedTime(`${dateStr} 23:59:59.999`, TZ);

  const prev_petty_cash = await tx.petty_cash.findFirst({
    where: {
      branch_id,
      created_at: { lt: startOfDay },
    },
    orderBy: { created_at: "desc" },
  });

  const [add_rows, expense_rows] = await Promise.all([
    tx.expenses.findMany({
      where: {
        branch_id,
        created_at: { gte: startOfDay, lte: endOfDay },
        purpose: "ADD_PETTY_CASH",
      },
    }),
    tx.expenses.findMany({
      where: {
        branch_id,
        created_at: { gte: startOfDay, lte: endOfDay },
        purpose: "EXPENSE",
      },
    }),
  ]);

  const total_add = add_rows.reduce((acc, r) => acc + r.amount.toNumber(), 0);
  const total_expense = expense_rows.reduce(
    (acc, r) => acc + r.amount.toNumber(),
    0,
  );

  const cash_on_hand =
    (prev_petty_cash ? prev_petty_cash.amount.toNumber() : 0) +
    total_add -
    total_expense;

  await tx.petty_cash.upsert({
    where: { petty_cash_id },
    update: {
      amount: cash_on_hand,
      remarks: "updated petty cash amount",
    },
    create: {
      amount: cash_on_hand,
      remarks: "created petty cash",
      created_at: fromZonedTime(`${dateStr} 12:00:00.000`, TZ),
      branch_id,
    },
  });
}

// Recomputes the given day and all subsequent petty_cash records in order.
// Processes asc so each day reads the freshly updated value of the day before.
async function cascadeFromDay(
  tx: PrismaTransactionClient,
  dateStr: string,
  petty_cash_id: string,
  branch_id: string,
) {
  await computeBalanceForDay(tx, petty_cash_id, dateStr, branch_id);

  const afterDay = fromZonedTime(`${dateStr} 23:59:59.999`, TZ);

  const subsequent = await tx.petty_cash.findMany({
    where: {
      branch_id,
      created_at: { gt: afterDay },
    },
    orderBy: { created_at: "asc" },
  });

  for (const pc of subsequent) {
    const nextDateStr = formatInTimeZone(pc.created_at, TZ, "yyyy-MM-dd");
    await computeBalanceForDay(tx, pc.petty_cash_id, nextDateStr, branch_id);
  }
}

// Computes expected balances for all petty_cash records in the given date range
// and returns only those with a meaningful drift (>= ₱0.01).
// Uses a chain check: each day's expected uses the previous day's expected (not stored),
// so a single corrupt day doesn't mask downstream drift.
type DriftedRecord = ConsistencyIssue & { petty_cash_id: string };

async function getDriftedRecords(
  branch_id: string,
  startDate: string,
  endDate: string,
): Promise<DriftedRecord[]> {
  const start = fromZonedTime(`${startDate} 00:00:00.000`, TZ);
  const end = fromZonedTime(`${endDate} 23:59:59.999`, TZ);

  const records = await prisma.petty_cash.findMany({
    where: { branch_id, created_at: { gte: start, lte: end } },
    orderBy: { created_at: "asc" },
  });

  if (records.length === 0) return [];

  const anchor = await prisma.petty_cash.findFirst({
    where: { branch_id, created_at: { lt: start } },
    orderBy: { created_at: "desc" },
  });

  const allExpenses = await prisma.expenses.findMany({
    where: { branch_id, created_at: { gte: start, lte: end } },
  });

  const expensesByDay = allExpenses.reduce<
    Record<string, { add: number; expense: number }>
  >((acc, e) => {
    const day = formatInTimeZone(e.created_at, TZ, "yyyy-MM-dd");
    if (!acc[day]) acc[day] = { add: 0, expense: 0 };
    if (e.purpose === "ADD_PETTY_CASH") acc[day].add += e.amount.toNumber();
    else acc[day].expense += e.amount.toNumber();
    return acc;
  }, {});

  const drifted: DriftedRecord[] = [];
  let prevBalance = anchor ? anchor.amount.toNumber() : 0;

  for (const pc of records) {
    const day = formatInTimeZone(pc.created_at, TZ, "yyyy-MM-dd");
    const { add = 0, expense = 0 } = expensesByDay[day] ?? {};
    const expected = parseFloat((prevBalance + add - expense).toFixed(2));
    const stored = parseFloat(pc.amount.toNumber().toFixed(2));
    const drift = parseFloat((stored - expected).toFixed(2));

    if (Math.abs(drift) >= 0.01) {
      drifted.push({ day, petty_cash_id: pc.petty_cash_id, stored, expected, drift });
    }

    prevBalance = expected;
  }

  return drifted;
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

        const dateStr = formatDate(created.created_at, "yyyy-MM-dd");
        await cascadeFromDay(tx, dateStr, petty_cash_id, input.branch_id);

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
            purpose: data.purpose,
          },
        });

        const dateStr = formatDate(updated_expense.created_at, "yyyy-MM-dd");

        const petty_cash = await ExpensesRepository.getPettyCashBalance(
          dateStr,
          updated_expense.branch_id,
        );

        if (!petty_cash) throw new Error("No Petty Cash");

        await cascadeFromDay(
          tx,
          dateStr,
          petty_cash.petty_cash_id,
          updated_expense.branch_id,
        );

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
      return await prisma.$transaction(async (tx) => {
        const updated = await tx.petty_cash.upsert({
          include: { branch: true },
          where: { petty_cash_id },
          update: { amount: data.amount, remarks: data.remarks || "" },
          create: {
            amount: data.amount,
            remarks: data.remarks || "",
            branch_id: data.branch_id,
            created_at: fromZonedTime(data.created_at, TZ),
          },
        });

        const dateStr = formatInTimeZone(updated.created_at, TZ, "yyyy-MM-dd");
        await cascadeFromDay(
          tx,
          dateStr,
          updated.petty_cash_id,
          updated.branch_id,
        );

        return updated;
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating petty cash!", {
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

        await tx.expenses.delete({ where: { expense_id } });

        const dateStr = formatDate(expense.created_at, "yyyy-MM-dd");

        const petty_cash = await ExpensesRepository.getPettyCashBalance(
          dateStr,
          expense.branch_id,
        );

        if (!petty_cash) throw new Error("No Petty Cash");

        await cascadeFromDay(
          tx,
          dateStr,
          petty_cash.petty_cash_id,
          expense.branch_id,
        );
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error deleting expense!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },

  recalculatePettyCash: async (petty_cash) => {
    try {
      await prisma.$transaction(async (tx) => {
        const dateStr = formatDate(
          new Date(petty_cash.created_at),
          "yyyy-MM-dd",
        );
        await cascadeFromDay(
          tx,
          dateStr,
          petty_cash.petty_cash_id,
          petty_cash.branch.branch_id,
        );
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

  checkConsistency: async (branch_id, startDate, endDate) => {
    try {
      const drifted = await getDriftedRecords(branch_id, startDate, endDate);
      return drifted.map(({ day, stored, expected, drift }) => ({
        day,
        stored,
        expected,
        drift,
      }));
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error checking consistency!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },

  repairConsistency: async (branch_id, startDate, endDate) => {
    try {
      const drifted = await getDriftedRecords(branch_id, startDate, endDate);
      if (drifted.length === 0) return null;

      const first = drifted[0];
      const firstDayStart = fromZonedTime(`${first.day} 00:00:00.000`, TZ);

      const toFix = await prisma.petty_cash.findMany({
        where: { branch_id, created_at: { gte: firstDayStart } },
        select: { petty_cash_id: true, amount: true },
      });

      const snapshot: PettyCashSnapshot = toFix.map((r) => ({
        petty_cash_id: r.petty_cash_id,
        amount: r.amount.toNumber(),
      }));

      await prisma.$transaction(async (tx) => {
        await cascadeFromDay(tx, first.day, first.petty_cash_id, branch_id);
      });

      return { repaired_from: first.day, days_fixed: toFix.length, snapshot };
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error repairing consistency!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },

  undoRepair: async (snapshot) => {
    try {
      await prisma.$transaction(async (tx) => {
        for (const { petty_cash_id, amount } of snapshot) {
          await tx.petty_cash.update({
            where: { petty_cash_id },
            data: { amount },
          });
        }
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error undoing repair!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
};
