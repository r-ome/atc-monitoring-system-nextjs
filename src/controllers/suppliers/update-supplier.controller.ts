import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { updateSupplierSchema } from "src/entities/models/Supplier";
import { updateSupplierUseCase } from "src/application/use-cases/suppliers/update-supplier.use-case";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { buildActivityLogDiff } from "@/app/lib/activity-log-diff";
import { SupplierRepository } from "src/infrastructure/di/repositories";
import { presentSupplier } from "./create-supplier.controller";

export const UpdateSupplierController = async (
  supplier_id: string,
  input: Record<string, unknown>,
) => {
  try {
    const { data, error: inputParseError } =
      updateSupplierSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const previous = await SupplierRepository.getSupplierBySupplierId(supplier_id);
    const supplier = await updateSupplierUseCase(supplier_id, data);
    const diffDescription = previous
      ? buildActivityLogDiff({
          previous,
          current: supplier,
          fields: [
            { label: "Name", getValue: (item) => item.name },
            { label: "Supplier Code", getValue: (item) => item.supplier_code },
            { label: "Japanese Name", getValue: (item) => item.japanese_name },
            { label: "Shipper", getValue: (item) => item.shipper },
            { label: "Email", getValue: (item) => item.email },
            {
              label: "Sales Remittance Account",
              getValue: (item) => item.sales_remittance_account,
            },
            { label: "Commission", getValue: (item) => item.commission },
            {
              label: "Contact Number",
              getValue: (item) => item.contact_number,
            },
          ],
        })
      : "";
    const description = diffDescription
      ? `Updated supplier ${supplier.name} | ${diffDescription}`
      : `Updated supplier ${supplier.name}`;
    await logActivity("UPDATE", "supplier", supplier_id, description);
    return ok(presentSupplier(supplier));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateSupplierController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UpdateSupplierController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateSupplierController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
