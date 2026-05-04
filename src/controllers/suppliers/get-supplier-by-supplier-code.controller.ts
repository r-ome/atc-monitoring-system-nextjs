import { getSupplierBySupplierCodeUseCase } from "src/application/use-cases/suppliers/get-supplier-by-supplier-code.use-case";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { SupplierWithContainersRow } from "src/entities/models/Supplier";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

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

const DATE_FORMAT = "MMM dd, yyyy hh:mm a";

function presenter(supplier: SupplierWithContainersRow) {
  return {
    supplier_id: supplier.supplier_id,
    supplier_code: supplier.supplier_code,
    name: supplier.name,
    japanese_name: supplier.japanese_name ?? "",
    commission: supplier.commission ?? "",
    sales_remittance_account: supplier.sales_remittance_account ?? "",
    email: supplier.email ?? "",
    contact_number: supplier.contact_number ?? "",
    shipper: supplier.shipper ?? "",
    created_at: formatDate(supplier.created_at, DATE_FORMAT),
    updated_at: formatDate(supplier.updated_at, DATE_FORMAT),
    deleted_at: supplier.deleted_at
      ? formatDate(supplier.deleted_at, DATE_FORMAT)
      : null,
    containers: supplier.containers.map((container) => {
      const sold_items = container.inventories.filter(
        (item) => item.status === "SOLD",
      ).length;
      const unsold_items = container.inventories.filter(
        (item) => item.status === "UNSOLD",
      ).length;

      const total_item_sales = container.inventories.reduce((sum, item) => {
        if (item.auctions_inventory?.status === "PAID") {
          return sum + (item.auctions_inventory.price ?? 0);
        }
        return sum;
      }, 0);

      const container_sales_commission = computeSalesCommission(total_item_sales);
      const atc_group_commission = Math.round(container_sales_commission / 3);
      const preparation_fee = Math.round(total_item_sales * 0.05);
      const royalty = computeRoyalty(total_item_sales);
      const atc_sales =
        container_sales_commission - atc_group_commission + preparation_fee - royalty;

      return {
        container_id: container.container_id,
        barcode: container.barcode,
        sold_items,
        unsold_items,
        branch: container.branch,
        due_date: container.due_date,
        arrival_date: container.arrival_date,
        total_item_sales,
        container_sales_commission,
        atc_group_commission,
        preparation_fee,
        royalty,
        atc_sales,
      };
    }),
  };
}

export const GetSupplierBySupplierCodeController = async (
  supplier_code: string,
) => {
  try {
    const supplier = await getSupplierBySupplierCodeUseCase(supplier_code);
    return ok(presenter(supplier));
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger("GetSupplierBySupplierCodeController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("GetSupplierBySupplierCodeController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Unhandled Error.",
    });
  }
};
