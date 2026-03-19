import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { ExpenseWithBranchRow } from "src/entities/models/Expense";

function presenter(expenses: ExpenseWithBranchRow[]) {
  return expenses.reduce((acc, expense) => {
    acc += expense.amount.toNumber();
    return acc;
  }, 0);
}

export const GetTotalExpensesController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const total_expenses = await ReportsRepository.getTotalExpenses(branch_id, date);
    return ok(presenter(total_expenses));
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
