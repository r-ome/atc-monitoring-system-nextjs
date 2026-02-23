import { logger } from "@/app/lib/logger";
import { updateExpenseUseCase } from "src/application/use-cases/payments/update-expense.use-case";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  updateExpenseSchema,
  UpdateExpenseInput,
} from "src/entities/models/Expense";
import { err, ok } from "src/entities/models/Result";

export const UpdateExpenseController = async (
  expense_id: string,
  input: Partial<UpdateExpenseInput>,
) => {
  try {
    const { data, error: inputParseError } =
      updateExpenseSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const res = await updateExpenseUseCase(expense_id, data);
    return ok(res);
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
