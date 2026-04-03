import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import {
  ExpenseSummaryDetailRow,
  ExpenseSummaryEntry,
} from "src/entities/models/Report";
import { ReportsRepository } from "src/infrastructure/di/repositories";

function presenter(rows: ExpenseSummaryDetailRow[]): ExpenseSummaryEntry[] {
  return rows.map((row) => ({
    expense_id: row.expense_id,
    created_at: formatDate(row.created_at, "MMM dd, yyyy hh:mm a"),
    created_at_value: row.created_at.toISOString(),
    amount: row.amount,
    purpose: row.purpose,
    remarks: row.remarks,
  }));
}

export function presentExpensesSummary(
  rows: ExpenseSummaryDetailRow[],
): ExpenseSummaryEntry[] {
  return presenter(rows);
}

export const GetExpensesSummaryController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const rows = await ReportsRepository.getExpensesSummary(branch_id, date);
    return ok(presenter(rows));
  } catch (error) {
    logger("GetExpensesSummaryController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
