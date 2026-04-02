import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { FilterMode } from "src/entities/models/Report";
import { presentCashFlow } from "./get-daily-cash-flow.controller";
import { presentPaymentMethodBreakdown } from "./get-payment-method-breakdown.controller";
import { presentTotalExpenses } from "./get-total-expenses.controller";
import { presentTotalSales } from "./get-total-sales.controller";

export const GetFinancialReportController = async (
  branch_id: string,
  date: string,
  mode: FilterMode,
) => {
  try {
    const [salesRows, expenseRows, paymentRows, cashFlowRows] =
      await Promise.all([
        ReportsRepository.getTotalSales(branch_id, date),
        ReportsRepository.getTotalExpenses(branch_id, date),
        ReportsRepository.getPaymentMethodBreakdown(branch_id, date),
        ReportsRepository.getDailyCashFlowPayments(branch_id, date),
      ]);

    return ok({
      sales: presentTotalSales(salesRows, mode),
      expenses: presentTotalExpenses(expenseRows, mode),
      paymentMethodBreakdown: presentPaymentMethodBreakdown(paymentRows),
      cashFlow: presentCashFlow(cashFlowRows, expenseRows, mode),
    });
  } catch (error) {
    logger("GetFinancialReportController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Failed to load financial reports", cause: error.message });
    }

    return err({
      message: "Failed to load financial reports",
      cause: "Server Error",
    });
  }
};
