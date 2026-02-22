import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import {
  createSupplierSchema,
  CreateSupplierInput,
  SupplierRow,
} from "src/entities/models/Supplier";
import { updateSupplierUseCase } from "src/application/use-cases/suppliers/update-supplier.use-case";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

function presenter(supplier: SupplierRow) {
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
    created_at: formatDate(supplier.created_at, date_format),
    updated_at: formatDate(supplier.updated_at, date_format),
    deleted_at: supplier.deleted_at
      ? formatDate(supplier.deleted_at, date_format)
      : null,
  };
}

export const UpdateSupplierController = async (
  supplier_id: string,
  input: Partial<CreateSupplierInput>,
) => {
  try {
    const { data, error: inputParseError } =
      createSupplierSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const supplier = await updateSupplierUseCase(supplier_id, data);
    return ok(presenter(supplier));
  } catch (error) {
    logger("UpdateSupplierController", error);
    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof InputParseError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
