import { SupplierRepository } from "src/infrastructure/di/repositories";
import { SupplierWithCountRow } from "src/entities/models/Supplier";
import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";

const DATE_FORMAT = "MMM dd, yyyy hh:mm a";

const presenter = (suppliers: SupplierWithCountRow[]) =>
  suppliers.map((supplier) => ({
    supplier_id: supplier.supplier_id,
    supplier_code: supplier.supplier_code,
    name: supplier.name,
    shipper: supplier.shipper ?? "",
    email: supplier.email ?? "",
    japanese_name: supplier.japanese_name ?? "",
    contact_number: supplier.contact_number ?? "",
    commission: supplier.commission ?? "",
    sales_remittance_account: supplier.sales_remittance_account ?? "",
    container_count: supplier._count.containers,
    created_at: formatDate(supplier.created_at, DATE_FORMAT),
    updated_at: formatDate(supplier.updated_at, DATE_FORMAT),
    deleted_at: supplier.deleted_at
      ? formatDate(supplier.deleted_at, DATE_FORMAT)
      : null,
  }));

export const GetSuppliersController = async () => {
  try {
    const supplier = await SupplierRepository.getSuppliers();
    return ok(presenter(supplier));
  } catch (error) {
    logger("GetSuppliersController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
