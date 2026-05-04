import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import {
  SupplierRevenueRow,
  SupplierRevenueSummaryEntry,
} from "src/entities/models/Report";

function computeRoyalty(sales: number): number {
  if (sales < 450_000) return 20_000;
  if (sales < 500_000) return 22_000;
  if (sales < 550_000) return 25_000;
  if (sales < 700_000) return 30_000;
  if (sales < 800_000) return 32_000;
  return 35_000;
}

// Kept for backward-compat with presentSupplierRevenue (used elsewhere)
export function computeAtcCom(revenue: number): number {
  if (revenue < 700_000) return Math.round(revenue * 0.25);
  if (revenue <= 799_999) return Math.round(revenue * 0.2);
  return Math.round(revenue * 0.15);
}

function computeSalesCommission(sales: number): number {
  return computeAtcCom(sales);
}

function presenter(rows: SupplierRevenueRow[]): SupplierRevenueSummaryEntry[] {
  // Group per-container rows by supplier
  const map = new Map<string, SupplierRevenueRow[]>();
  for (const row of rows) {
    const key = row.supplier_code;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }

  return Array.from(map.values()).map((containers) => {
    const first = containers[0];

    const total_item_sales = containers.reduce((s, c) => s + c.total_revenue, 0);
    const items_sold = containers.reduce((s, c) => s + c.items_sold, 0);
    const container_count = containers.reduce((s, c) => s + c.container_count, 0);
    // Royalty is the sum of per-container flat fees
    const royalty = containers.reduce((s, c) => s + computeRoyalty(c.total_revenue), 0);

    const container_sales_commission = computeSalesCommission(total_item_sales);
    const atc_group_commission = Math.round(container_sales_commission / 3);
    const preparation_fee = Math.round(total_item_sales * 0.05);
    const atc_sales =
      container_sales_commission - atc_group_commission + preparation_fee - royalty;

    return {
      supplier_name: first.supplier_name,
      supplier_code: first.supplier_code,
      sales_remittance_account: first.sales_remittance_account,
      container_count,
      items_sold,
      total_item_sales,
      container_sales_commission,
      atc_group_commission,
      preparation_fee,
      royalty,
      atc_sales,
    };
  });
}

export function presentSupplierRevenue(rows: SupplierRevenueRow[]): SupplierRevenueSummaryEntry[] {
  return presenter(rows);
}

export const GetSupplierRevenueController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const rows = await ReportsRepository.getSupplierRevenueSummary(branch_id, date);
    return ok(presenter(rows));
  } catch (error) {
    logger("GetSupplierRevenueController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};
