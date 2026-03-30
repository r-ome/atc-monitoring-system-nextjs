import {
  createSupplierSchema,
  SupplierRow,
} from "src/entities/models/Supplier";
import { formatDate } from "@/app/lib/utils";
import { SupplierRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";

const DATE_FORMAT = "MMM dd, yyyy hh:mm a";

export const presentSupplier = (supplier: SupplierRow) => ({
  ...supplier,
  created_at: formatDate(supplier.created_at, DATE_FORMAT),
  updated_at: formatDate(supplier.updated_at, DATE_FORMAT),
  deleted_at: supplier.deleted_at
    ? formatDate(supplier.deleted_at, DATE_FORMAT)
    : null,
});

export const CreateSupplierController = async (
  input: Record<string, unknown>,
) => {
  try {
    const { data, error: inputParseError } =
      createSupplierSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const supplier = await SupplierRepository.createSupplier(data);
    void logActivity("CREATE", "supplier", supplier.supplier_id, `Created supplier ${supplier.name}`);
    return ok(presentSupplier(supplier));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("CreateSupplierController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("CreateSupplierController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
