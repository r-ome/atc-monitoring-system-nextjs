import { updatePettyCashUseCase } from "src/application/use-cases/expenses/update-petty-cash.use-case";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  PettyCashWithBranchRow,
  createPettyCashSchema,
  CreatePettyCashInput,
} from "src/entities/models/Expense";
import { err, ok } from "src/entities/models/Result";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

function presenter(petty_cash: PettyCashWithBranchRow) {
  return {
    petty_cash_id: petty_cash.petty_cash_id,
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
  input: Partial<CreatePettyCashInput>,
) => {
  const ctx = RequestContext.getStore();
  const user_context = {
    username: ctx?.username,
    branch_name: ctx?.branch_name,
  };

  try {
    const { data, error: inputParseError } =
      createPettyCashSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const expense = await updatePettyCashUseCase(petty_cash_id, data);
    logger("UpdatePettyCashController", { data, ...user_context }, "info");
    return ok(presenter(expense));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdatePettyCashController", error, "warn");
      return err({
        message: error.message,
        cause: error.cause,
      });
    }

    logger("UpdatePettyCashController", error);
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
