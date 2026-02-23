import { DatabaseOperationError } from "src/entities/errors/common";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { deleteExpenseUseCase } from "src/application/use-cases/expenses/delete-expense.use-case";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

export const DeleteExpenseController = async (expense_id: string) => {
  const ctx = RequestContext.getStore();
  const user_context = {
    username: ctx?.username,
    branch_name: ctx?.branch_name,
  };
  try {
    await deleteExpenseUseCase(expense_id);
    logger("DeleteExpenseController", { ...user_context }, "info");
    return ok({ message: "expense deleted" });
  } catch (error) {
    logger("DeleteExpenseController", error);

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
