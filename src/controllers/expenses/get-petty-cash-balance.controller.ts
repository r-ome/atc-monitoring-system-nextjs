import { getPettyCashBalanceUseCase } from "src/application/use-cases/expenses/get-petty-cash-balance.use-case";
import { ExpenseSchema } from "src/entities/models/Expense";
import { DatabaseOperationError } from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";

function presenter(petty_cash_balance: ExpenseSchema | null) {
  if (petty_cash_balance) return petty_cash_balance.balance;
  else return 0;
}

export const GetPettyCashBalanceController = async (date: Date) => {
  try {
    const petty_cash_balance = await getPettyCashBalanceUseCase(date);
    return ok(presenter(petty_cash_balance));
  } catch (error) {
    logger("GetExpensesByDateController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
