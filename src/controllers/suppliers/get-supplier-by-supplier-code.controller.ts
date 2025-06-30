import { getSupplierBySupplierCodeUseCase } from "src/application/use-cases/suppliers/get-supplier-by-supplier-code.use-case";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Response";
import { SupplierSchema } from "src/entities/models/Supplier";
import { format } from "date-fns";

function presenter(supplier: SupplierSchema) {
  const date_format = "MMMM dd, yyyy";
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
    created_at: format(supplier.created_at, date_format),
    updated_at: format(supplier.updated_at, date_format),
    deleted_at: supplier.deleted_at
      ? format(supplier.deleted_at, date_format)
      : null,
    containers: supplier.containers.map((container) => {
      const sold_items = container.inventories.filter(
        (item) => item.status === "SOLD"
      );
      const unsold_items = container.inventories.filter(
        (item) => item.status === "UNSOLD"
      );
      return {
        container_id: container.container_id,
        barcode: container.barcode,
        inventories: container.inventories,
        unsold_items: unsold_items.length,
        sold_items: sold_items.length,
      };
    }),
  };
}

export const getSupplierBySupplierCodeController = async (
  supplier_code: string
) => {
  try {
    const supplier = await getSupplierBySupplierCodeUseCase(supplier_code);
    return ok(presenter(supplier));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Unhandled Error.",
    });
  }
};
