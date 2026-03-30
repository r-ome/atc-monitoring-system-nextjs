import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { ExpensesRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  updateExpenseSchema,
  UpdateExpenseInput,
  ExpenseWithBranchRow,
} from "src/entities/models/Expense";
import { err, ok } from "src/entities/models/Result";
import { formatDate } from "@/app/lib/utils";

const DATE_FORMAT = "MMMM dd, yyyy hh:mm a";

function presenter(expense: ExpenseWithBranchRow) {
  return {
    expense_id: expense.expense_id,
    amount: expense.amount.toNumber(),
    purpose: expense.purpose,
    remarks: expense.remarks,
    branch: {
      branch_id: expense.branch.branch_id,
      name: expense.branch.name,
    },
    created_at: formatDate(expense.created_at, DATE_FORMAT),
  };
}

export const UpdateExpenseController = async (
  expense_id: string,
  input: Partial<UpdateExpenseInput>,
) => {
  const ctx = RequestContext.getStore();
  const user_context = {
    username: ctx?.username,
    branch_name: ctx?.branch_name,
  };

  try {
    const { data, error: inputParseError } =
      updateExpenseSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const expense = await ExpensesRepository.updateExpense(expense_id, data);
    logger("UpdateExpenseController", { data, ...user_context }, "info");
    await logActivity("UPDATE", "expense", expense_id, `Updated expense to ₱${data.amount} - ${data.remarks}`);
    return ok(presenter(expense));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateExpenseController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateExpenseController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error?.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
