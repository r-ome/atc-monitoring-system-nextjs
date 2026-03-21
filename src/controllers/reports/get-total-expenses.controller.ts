import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { ExpenseWithBranchRow } from "src/entities/models/Expense";
import { FilterMode } from "src/entities/models/Report";
import { formatDate } from "@/app/lib/utils";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

export type ExpenseRow = {
  key: string;
  label: string;
  total_expenses: number;
};

function dailyPresenter(expenses: ExpenseWithBranchRow[]): ExpenseRow[] {
  const result = new Map<string, { label: string; total: number }>();

  for (const expense of expenses) {
    const key = formatDate(expense.created_at, "yyyy-MM-dd");
    const existing = result.get(key) ?? {
      label: formatDate(expense.created_at, "MMM dd, yyyy"),
      total: 0,
    };
    existing.total += expense.amount.toNumber();
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

function monthlyPresenter(expenses: ExpenseWithBranchRow[]): ExpenseRow[] {
  const monthBuckets = MONTHS.map(() => 0);

  for (const expense of expenses) {
    const monthIndex = expense.created_at.getMonth();
    monthBuckets[monthIndex] += expense.amount.toNumber();
  }

  return monthBuckets
    .map((total, i) => ({
      key: MONTHS[i],
      label: MONTHS[i],
      total_expenses: total,
    }))
    .filter((row) => row.total_expenses > 0);
}

export function presentTotalExpenses(expenses: ExpenseWithBranchRow[], mode: FilterMode): ExpenseRow[] {
  return mode === "monthly" ? monthlyPresenter(expenses) : dailyPresenter(expenses);
}

export const GetTotalExpensesController = async (
  branch_id: string,
  date: string,
  mode: FilterMode,
) => {
  try {
    const expenses = await ReportsRepository.getTotalExpenses(branch_id, date);
    const rows =
      mode === "monthly"
        ? monthlyPresenter(expenses)
        : dailyPresenter(expenses);
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
