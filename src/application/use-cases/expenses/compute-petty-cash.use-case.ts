import { ExpensesRepository } from "src/infrastructure/repositories/expenses.repository";
import { subDays } from "date-fns";
import prisma from "@/app/lib/prisma/prisma";
import { formatDate } from "@/app/lib/utils";
import { fromZonedTime } from "date-fns-tz";
const TZ = "Asia/Manila";

export const computePettyCashUseCase = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  petty_cash_id: string,
  input: { created_at: string; branch_id: string },
) => {
  const startOfDay = fromZonedTime(`${input.created_at} 00:00:00.000`, TZ);
  const endOfDay = fromZonedTime(`${input.created_at} 23:59:59.999`, TZ);

  const last_petty_cash = await ExpensesRepository.getPettyCashBalance(
    formatDate(subDays(new Date(input.created_at), 1), "yyyy-MM-dd"),
    input.branch_id,
  );

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
};
