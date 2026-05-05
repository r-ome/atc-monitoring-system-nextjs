import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { ContainerStatusRow, ContainerStatusEntry } from "src/entities/models/Report";
import { formatDate } from "@/app/lib/utils";

function computeRoyalty(sales: number): number {
  if (sales < 450_000) return 20_000;
  if (sales < 500_000) return 22_000;
  if (sales < 550_000) return 25_000;
  if (sales < 700_000) return 30_000;
  if (sales < 800_000) return 32_000;
  return 35_000;
}

function computeSalesCommission(sales: number): number {
  if (sales < 700_000) return Math.round(sales * 0.25);
  if (sales <= 799_999) return Math.round(sales * 0.2);
  return Math.round(sales * 0.15);
}

function diffCalendarDays(later: Date, earlier: Date): number {
  return Math.floor(
    (startOfDay(later).getTime() - startOfDay(earlier).getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function computeDelayDays(
  paid_at: Date | null,
  due_date: Date | null,
  today: Date,
): number | null {
  if (!due_date) return null;

  if (paid_at) {
    return startOfDay(paid_at) > startOfDay(due_date)
      ? diffCalendarDays(paid_at, due_date)
      : null;
  }

  return startOfDay(today) > startOfDay(due_date)
    ? diffCalendarDays(today, due_date)
    : null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function computeDaysLeft(
  paid_at: Date | null,
  due_date: Date | null,
  today: Date,
): number | null {
  if (paid_at || !due_date) return null;
  if (startOfDay(today) > startOfDay(due_date)) return null;

  return diffCalendarDays(due_date, today);
}

function presenter(rows: ContainerStatusRow[]): ContainerStatusEntry[] {
  const today = new Date();

  return rows.map((container) => {
    const days_since_arrival =
      container.paid_at
        ? 0
        : container.arrival_date
          ? Math.floor(
              (today.getTime() - container.arrival_date.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null;
    const delay_days = computeDelayDays(container.paid_at, container.due_date, today);
    const days_left = computeDaysLeft(container.paid_at, container.due_date, today);

    const total_item_sales = container.total_item_sales;
    const container_sales_commission = computeSalesCommission(total_item_sales);
    const atc_group_commission = Math.round(container_sales_commission / 3);
    const preparation_fee = Math.round(total_item_sales * 0.05);
    const royalty = computeRoyalty(total_item_sales);
    const atc_sales =
      container_sales_commission - atc_group_commission + preparation_fee - royalty;

    return {
      barcode: container.barcode,
      container_number: container.container_number,
      supplier_name: container.supplier_name,
      sales_remittance_account: container.sales_remittance_account,
      status: container.paid_at ? "PAID" : "UNPAID",
      paid_at: container.paid_at
        ? formatDate(container.paid_at, "MMM dd, yyyy")
        : null,
      arrival_date: container.arrival_date
        ? formatDate(container.arrival_date, "MMM dd, yyyy")
        : null,
      due_date: container.due_date
        ? formatDate(container.due_date, "MMM dd, yyyy")
        : null,
      days_since_arrival,
      days_left,
      delay_days,
      duties_and_taxes: Number(container.duties_and_taxes),
      total_items: container.total_items,
      paid_items: container.paid_items,
      total_item_sales,
      total_service_charge: container.total_service_charge,
      container_sales_commission,
      atc_group_commission,
      preparation_fee,
      royalty,
      atc_sales,
    };
  });
}

export function presentContainerStatus(rows: ContainerStatusRow[]): ContainerStatusEntry[] {
  return presenter(rows);
}

export const GetContainerStatusController = async (branch_id: string) => {
  try {
    const rows = await ReportsRepository.getContainerStatusOverview(branch_id);
    return ok(presenter(rows));
  } catch (error) {
    logger("GetContainerStatusController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};
