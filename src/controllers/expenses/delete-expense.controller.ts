import { DatabaseOperationError } from "src/entities/errors/common";
import { deleteExpenseUseCase } from "src/application/use-cases/expenses/delete-expense.use-case";
import { err, ok } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";

export const DeleteExpenseController = async (expense_id: string) => {
  try {
    await deleteExpenseUseCase(expense_id);
    return ok({ message: "expense deleted" });
  } catch (error) {
    logger("UpdatePettyCashController", error);

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
