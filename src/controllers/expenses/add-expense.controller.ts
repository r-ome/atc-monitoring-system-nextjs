import { addExpenseUseCase } from "src/application/use-cases/expenses/add-expense.use-case";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  ExpenseInsertSchema,
  ExpenseSchema,
  type ExpenseInsertSchema as ExpenseInsertSchemaType,
} from "src/entities/models/Expense";
import { err, ok } from "src/entities/models/Response";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

function presenter(expense: ExpenseSchema) {
  return {
    expense_id: expense.expense_id,
    amount: expense.amount,
    purpose: expense.purpose,
    remarks: expense.remarks,
    balance: expense.balance,
    created_at: formatDate(expense.created_at, "MMMM dd hh:mm a"),
  };
}

export const AddExpenseController = async (
  input: Partial<ExpenseInsertSchemaType>
) => {
  try {
    if (input.created_at) {
      input.created_at = new Date(input.created_at);
    }
    const { data, error: inputParseError } =
      ExpenseInsertSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const expense = await addExpenseUseCase(data);

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
