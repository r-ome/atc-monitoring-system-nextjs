import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { ExpensesRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
  InsufficientCashError,
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
    employee: expense.employee
      ? {
          employee_id: expense.employee.employee_id,
          first_name: expense.employee.first_name,
          last_name: expense.employee.last_name,
          full_name: `${expense.employee.first_name} ${expense.employee.last_name}`,
        }
      : null,
    created_at: formatDate(expense.created_at, DATE_FORMAT),
    updated_at: formatDate(expense.updated_at, DATE_FORMAT),
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

    const { updated, previous } = await ExpensesRepository.updateExpense(expense_id, data);
    logger("UpdateExpenseController", { data, ...user_context }, "info");
    const nextEmployeeId = data.employee_id ?? null;
    const hasChanges =
      previous.amount !== data.amount ||
      previous.purpose !== data.purpose ||
      previous.remarks !== data.remarks ||
      previous.employee_id !== nextEmployeeId;
    if (hasChanges) {
      const expenseDate = formatDate(updated.created_at, "MMMM dd, yyyy");
      const parts = [
        `Type: ${previous.purpose} → ${data.purpose}`,
        `Amount: ₱${previous.amount} → ₱${data.amount}`,
        `Remarks: ${previous.remarks} → ${data.remarks}`,
      ];
      if (previous.employee_id !== nextEmployeeId) {
        const nextEmployeeName = updated.employee
          ? `${updated.employee.first_name} ${updated.employee.last_name}`
          : null;
        parts.push(`Employee: ${previous.employee_name ?? "—"} → ${nextEmployeeName ?? "—"}`);
      }
      await logActivity("UPDATE", "expense", expense_id, `Updated expense (${expenseDate}) — ${parts.join(" | ")}`);
    }
    return ok(presenter(updated));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateExpenseController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof InsufficientCashError) {
      logger("UpdateExpenseController", error, "warn");
      return err({ message: error.message });
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
