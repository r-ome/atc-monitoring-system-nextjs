import { DatabaseOperationError } from "src/entities/errors/common";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { ExpensesRepository } from "src/infrastructure/di/repositories";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { formatDate } from "@/app/lib/utils";

export const DeleteExpenseController = async (expense_id: string) => {
  const ctx = RequestContext.getStore();
  const user_context = {
    username: ctx?.username,
    branch_name: ctx?.branch_name,
  };
  try {
    const deleted = await ExpensesRepository.deleteExpense(expense_id);
    logger("DeleteExpenseController", { ...user_context }, "info");
    const expenseDate = formatDate(deleted.created_at, "MMMM dd, yyyy");
    await logActivity("DELETE", "expense", expense_id, `Deleted expense ₱${deleted.amount} - ${deleted.remarks} (${expenseDate})`);
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
