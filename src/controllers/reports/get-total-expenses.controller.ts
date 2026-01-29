import { ok, err } from "src/entities/models/Response";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { getTotalExpensesUseCase } from "src/application/use-cases/reports/get-total-expenses.use-case";
import { ExpenseSchema } from "src/entities/models/Expense";

function presenter(expenses: ExpenseSchema[]) {
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
    const total_expenses = await getTotalExpensesUseCase(branch_id, date);
    return ok(presenter(total_expenses));
  } catch (error) {
    logger("GetTotalSalesController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
