import { getExpensesByDateUseCase } from "src/application/use-cases/expenses/get-expenses-by-date.use-case";
import { ExpenseSchema } from "src/entities/models/Expense";
import { DatabaseOperationError } from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Response";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

function presenter(expenses: ExpenseSchema[]) {
  return {
    expenses: expenses.map((expense) => ({
      expense_id: expense.expense_id,
      balance: expense.balance.toNumber(),
      amount: expense.amount.toNumber(),
      purpose: expense.purpose,
      remarks: expense.remarks,
      created_at: formatDate(expense.created_at, "MMMM dd, yyyy hh:mm a"),
    })),
  };
}

export const GetExpensesByDateController = async (
  date: Date,
  branch_id: string | undefined
) => {
  try {
    const { expenses } = await getExpensesByDateUseCase(date, branch_id);
    return ok(presenter(expenses));
  } catch (error) {
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
