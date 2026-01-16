import { updatePettyCashUseCase } from "src/application/use-cases/expenses/update-petty-cash.use-case";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  PettyCashSchema,
  type PettyCashInsertSchemaType,
  PettyCashInsertSchema,
} from "src/entities/models/Expense";
import { err, ok } from "src/entities/models/Response";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

function presenter(petty_cash: PettyCashSchema) {
  return {
    petty_cash_id: petty_cash.petty_cash_id,
    balance: petty_cash.balance.toNumber(),
    remarks: petty_cash.remarks,
    branch: {
      branch_id: petty_cash.branch.branch_id,
      name: petty_cash.branch.name,
    },
    created_at: formatDate(petty_cash.created_at, "MMMM dd hh:mm a"),
    updated_at: formatDate(petty_cash.updated_at, "MMMM dd hh:mm a"),
  };
}

export const UpdatePettyCashController = async (
  petty_cash_id: string,
  input: Partial<PettyCashInsertSchemaType>
) => {
  try {
    if (input.created_at) {
      input.created_at = new Date(input.created_at);
    }

    const { data, error: inputParseError } =
      PettyCashInsertSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const expense = await updatePettyCashUseCase(petty_cash_id, data);
    return ok(presenter(expense));
  } catch (error) {
    logger("UpdatePettyCashController", error);
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
