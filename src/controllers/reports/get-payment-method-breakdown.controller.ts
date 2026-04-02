import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import {
  PaymentMethodBreakdownRow,
  PaymentMethodBreakdown,
} from "src/entities/models/Report";

function presenter(payments: PaymentMethodBreakdownRow[]): PaymentMethodBreakdown[] {
  return payments
    .map((payment) => ({
      payment_method_name: payment.payment_method_name,
      total_amount: payment.total_amount,
      transaction_count: payment.transaction_count,
    }))
    .sort((a, b) => b.total_amount - a.total_amount);
}

export function presentPaymentMethodBreakdown(payments: PaymentMethodBreakdownRow[]): PaymentMethodBreakdown[] {
  return presenter(payments);
}

export const GetPaymentMethodBreakdownController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const payments = await ReportsRepository.getPaymentMethodBreakdown(branch_id, date);
    return ok(presenter(payments));
  } catch (error) {
    logger("GetPaymentMethodBreakdownController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
