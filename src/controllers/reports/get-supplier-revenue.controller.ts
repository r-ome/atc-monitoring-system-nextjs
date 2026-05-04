import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import {
  SupplierRevenueRow,
  SupplierRevenueSummaryEntry,
} from "src/entities/models/Report";

// Tiered ATC commission matching generateMonthlyCommission.ts (column E)
function computeAtcCom(revenue: number): number {
  if (revenue < 700_000) return Math.round(revenue * 0.25);
  if (revenue <= 799_999) return Math.round(revenue * 0.2);
  return Math.round(revenue * 0.15);
}

function presenter(rows: SupplierRevenueRow[]): SupplierRevenueSummaryEntry[] {
  return rows.map((supplier) => {
    const total_revenue = supplier.total_revenue;
    const atc_com = computeAtcCom(total_revenue);
    const atc_group_com = Math.round(atc_com / 3);

    return {
      supplier_name: supplier.supplier_name,
      supplier_code: supplier.supplier_code,
      container_count: supplier.container_count,
      items_sold: supplier.items_sold,
      total_revenue,
      atc_com,
      atc_group_com,
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
