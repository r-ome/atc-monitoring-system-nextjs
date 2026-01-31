import { getPettyCashBalanceUseCase } from "src/application/use-cases/expenses/get-petty-cash-balance.use-case";
import { PettyCashSchema } from "src/entities/models/Expense";
import {
  InputParseError,
  DatabaseOperationError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";
import { formatDate } from "@/app/lib/utils";

function presenter(petty_cash: PettyCashSchema) {
  const date_format = "MMM dd, yyyy HH:mm:ss";

  return {
    petty_cash_id: petty_cash.petty_cash_id,
    amount: petty_cash.amount.toNumber(),
    remarks: petty_cash.remarks,
    branch: {
      branch_id: petty_cash.branch.branch_id,
      name: petty_cash.branch.name,
    },
    created_at: formatDate(petty_cash.created_at, date_format),
    updated_at: formatDate(petty_cash.updated_at, date_format),
  };
}

export const GetPettyCashBalanceController = async (
  date: string,
  branch_id: string | undefined,
) => {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new InputParseError("Invalid date param");
    }

    const petty_cash = await getPettyCashBalanceUseCase(date, branch_id);
    if (petty_cash === null) return ok(null);
    return ok(presenter(petty_cash));
  } catch (error) {
    logger("GetPettyCashBalanceController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
