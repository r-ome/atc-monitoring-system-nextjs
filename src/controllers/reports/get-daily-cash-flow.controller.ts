import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import {
  DailyCashFlowPaymentRow,
  ExpenseSummaryRow,
  CashFlowEntry,
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

function buildEntries(
  receipts: DailyCashFlowPaymentRow[],
  expenses: ExpenseSummaryRow[],
  keyFn: (date: Date) => string,
  labelFn: (date: Date) => string,
): CashFlowEntry[] {
  const map = new Map<string, CashFlowEntry>();

  function getOrCreate(date: Date): CashFlowEntry {
    const key = keyFn(date);
    if (!map.has(key)) {
      map.set(key, {
        date: labelFn(date),
        inflow_pull_out: 0,
        inflow_add_on: 0,
        outflow_refunded: 0,
        outflow_less: 0,
        outflow_expenses: 0,
        net: 0,
      });
    }
    return map.get(key)!;
  }

  for (const receipt of receipts) {
    const entry = getOrCreate(receipt.created_at);

    if (receipt.purpose === "PULL_OUT") {
      entry.inflow_pull_out += receipt.total_amount;
    }
    if (receipt.purpose === "ADD_ON") {
      entry.inflow_add_on += receipt.total_amount;
    }
    if (receipt.purpose === "REFUNDED") {
      entry.outflow_refunded += receipt.total_amount;
    }
    if (receipt.purpose === "LESS") {
      entry.outflow_less += receipt.total_amount;
    }
  }

  for (const expense of expenses) {
    const entry = getOrCreate(expense.created_at);
    entry.outflow_expenses += expense.total_amount;
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, entry]) => {
      const totalInflow = entry.inflow_pull_out + entry.inflow_add_on;
      const totalOutflow =
        entry.outflow_refunded + entry.outflow_less + entry.outflow_expenses;
      entry.net = totalInflow - totalOutflow;
      return entry;
    });
}

export function presentCashFlow(
  receipts: DailyCashFlowPaymentRow[],
  expenses: ExpenseSummaryRow[],
  mode: FilterMode,
): CashFlowEntry[] {
  if (mode === "monthly") {
    return buildEntries(
      receipts,
      expenses,
      (d) => String(d.getMonth()).padStart(2, "0"),
      (d) => MONTHS[d.getMonth()],
    );
  }

  if (mode === "weekly") {
    return buildEntries(
      receipts,
      expenses,
      (d) => getWeekBucket(d).key,
      (d) => getWeekBucket(d).label,
    );
  }

  return buildEntries(
    receipts,
    expenses,
    (d) => formatDate(d, "yyyy-MM-dd"),
    (d) => formatDate(d, "MMM dd, yyyy"),
  );
}

export const GetCashFlowController = async (
  branch_id: string,
  date: string,
  mode: FilterMode,
) => {
  try {
    const [receipts, expenses] = await Promise.all([
      ReportsRepository.getDailyCashFlowPayments(branch_id, date),
      ReportsRepository.getTotalExpenses(branch_id, date),
    ]);

    const entries = presentCashFlow(receipts, expenses, mode);

    return ok(entries);
  } catch (error) {
    logger("GetCashFlowController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
