import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import {
  PaymentMethodBreakdownRow,
  PaymentMethodBreakdown,
} from "src/entities/models/Report";

function presenter(payments: PaymentMethodBreakdownRow[]): PaymentMethodBreakdown[] {
  const map = new Map<string, { total_amount: number; transaction_count: number }>();

  for (const payment of payments) {
    const name = payment.payment_method?.name ?? "Unknown";
    const existing = map.get(name) ?? { total_amount: 0, transaction_count: 0 };
    existing.total_amount += payment.amount_paid;
    existing.transaction_count += 1;
    map.set(name, existing);
  }

  return Array.from(map.entries())
    .map(([payment_method_name, data]) => ({
      payment_method_name,
      ...data,
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
