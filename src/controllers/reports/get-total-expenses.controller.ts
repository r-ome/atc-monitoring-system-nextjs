import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import {
  ExpenseSummaryRow,
  FilterMode,
} from "src/entities/models/Report";
import { formatDate } from "@/app/lib/utils";
import { endOfWeek, max, min, startOfWeek } from "date-fns";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

function getWeekBucket(date: Date) {
  const year = Number(formatDate(date, "yyyy"));
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const weekStart = max([startOfWeek(date, { weekStartsOn: 0 }), yearStart]);
  const weekEnd = min([endOfWeek(date, { weekStartsOn: 0 }), yearEnd]);
  const startLabel = formatDate(weekStart, "MMM d");
  const endLabel = formatDate(weekEnd, "MMM d");

  return {
    key: formatDate(weekStart, "yyyy-MM-dd"),
    label: `${startLabel} - ${endLabel}`,
  };
}

export type ExpenseRow = {
  key: string;
  label: string;
  total_expenses: number;
};

function dailyPresenter(expenses: ExpenseSummaryRow[]): ExpenseRow[] {
  const result = new Map<string, { label: string; total: number }>();

  for (const expense of expenses) {
    const key = formatDate(expense.created_at, "yyyy-MM-dd");
    const existing = result.get(key) ?? {
      label: formatDate(expense.created_at, "MMM dd, yyyy"),
      total: 0,
    };
    existing.total += expense.total_amount;
    result.set(key, existing);
  }

  return Array.from(result.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { label, total }]) => ({
      key,
      label,
      total_expenses: total,
    }));
}

function monthlyPresenter(expenses: ExpenseSummaryRow[]): ExpenseRow[] {
  const monthBuckets = MONTHS.map(() => 0);

  for (const expense of expenses) {
    const monthIndex = expense.created_at.getMonth();
    monthBuckets[monthIndex] += expense.total_amount;
  }

  return monthBuckets
    .map((total, i) => ({
      key: MONTHS[i],
      label: MONTHS[i],
      total_expenses: total,
    }))
    .filter((row) => row.total_expenses > 0);
}

function weeklyPresenter(expenses: ExpenseSummaryRow[]): ExpenseRow[] {
  const weekBuckets = new Map<string, ExpenseRow>();

  for (const expense of expenses) {
    const { key, label } = getWeekBucket(expense.created_at);
    const existing = weekBuckets.get(key) ?? {
      key,
      label,
      total_expenses: 0,
    };

    existing.total_expenses += expense.total_amount;
    weekBuckets.set(key, existing);
  }

  return Array.from(weekBuckets.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .filter((row) => row.total_expenses > 0);
}

export function presentTotalExpenses(
  expenses: ExpenseSummaryRow[],
  mode: FilterMode,
): ExpenseRow[] {
  if (mode === "monthly") return monthlyPresenter(expenses);
  if (mode === "weekly") return weeklyPresenter(expenses);
  return dailyPresenter(expenses);
}

export const GetTotalExpensesController = async (
  branch_id: string,
  date: string,
  mode: FilterMode,
) => {
  try {
    const expenses = await ReportsRepository.getTotalExpenses(branch_id, date);
    const rows = presentTotalExpenses(expenses, mode);
    return ok(rows);
  } catch (error) {
    logger("GetTotalExpensesController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
