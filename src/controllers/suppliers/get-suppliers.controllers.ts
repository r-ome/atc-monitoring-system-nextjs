import { getSuppliersUseCase } from "src/application/use-cases/suppliers/get-suppliers.use-case";
import { SupplierSchema } from "src/entities/models/Supplier";
import { format } from "date-fns";
import { ok, err } from "src/entities/models/Response";
import { DatabaseOperationError } from "src/entities/errors/common";

const presenter = (suppliers: Omit<SupplierSchema, "containers">[]) => {
  const date_format = "MMM dd, yyyy";
  return suppliers.map((supplier) => ({
    supplier_id: supplier.supplier_id,
    supplier_code: supplier.supplier_code,
    name: supplier.name,
    shipper: supplier.shipper || "",
    email: supplier.email || "",
    japanese_name: supplier.japanese_name || "",
    contact_number: supplier.contact_number || "",
    commission: supplier.commission || "",
    sales_remittance_account: supplier.sales_remittance_account || "",
    created_at: format(supplier.created_at, date_format),
    updated_at: format(supplier.updated_at, date_format),
    deleted_at: supplier.deleted_at
      ? format(supplier.deleted_at, date_format)
      : null,
  }));
};

export const GetSuppliersController = async () => {
  try {
    const supplier = await getSuppliersUseCase();
    return ok(presenter(supplier));
  } catch (error) {
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
