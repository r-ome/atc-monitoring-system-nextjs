import { addExpenseUseCase } from "src/application/use-cases/expenses/add-expense.use-case";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  createExpenseSchema,
  CreateExpenseInput,
  ExpenseWithBranchRow,
} from "src/entities/models/Expense";
import { err, ok } from "src/entities/models/Result";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

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
    created_at: formatDate(expense.created_at, "MMMM dd hh:mm a"),
  };
}

export const AddExpenseController = async (
  petty_cash_id: string,
  input: Partial<CreateExpenseInput>,
) => {
  try {
    const { data, error: inputParseError } =
      createExpenseSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const expense = await addExpenseUseCase(petty_cash_id, data);
    return ok(presenter(expense));
  } catch (error) {
    logger("AddExpenseController", error);
    if (error instanceof InputParseError) {
      return err({
        message: error.message,
        cause: error.cause,
      });
    }

    if (error instanceof DatabaseOperationError) {
      return err({
        message: "Server Error",
        cause: error.message,
      });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
