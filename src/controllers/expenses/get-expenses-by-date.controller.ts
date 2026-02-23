import { getExpensesByDateUseCase } from "src/application/use-cases/expenses/get-expenses-by-date.use-case";
import { ExpenseWithBranchRow } from "src/entities/models/Expense";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

function presenter(expenses: ExpenseWithBranchRow[]) {
  return expenses.map((expense) => ({
    expense_id: expense.expense_id,
    amount: expense.amount.toNumber(),
    purpose: expense.purpose,
    remarks: expense.remarks,
    branch: {
      branch_id: expense.branch_id,
      name: expense.branch.name,
    },
    created_at: formatDate(expense.created_at, "MMMM dd, yyyy hh:mm a"),
  }));
}

export const GetExpensesByDateController = async (
  date: string,
  branch_id: string | undefined,
) => {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new InputParseError("Invalid date param");
    }

    const expenses = await getExpensesByDateUseCase(date, branch_id);
    return ok(presenter(expenses));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("GetExpensesByDateController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("GetExpensesByDateController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
