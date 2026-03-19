import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { updateSupplierSchema } from "src/entities/models/Supplier";
import { updateSupplierUseCase } from "src/application/use-cases/suppliers/update-supplier.use-case";
import { logger } from "@/app/lib/logger";
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

    const supplier = await updateSupplierUseCase(supplier_id, data);
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
