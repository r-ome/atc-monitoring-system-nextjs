import {
  SupplierSchema,
  SupplierInsertSchema,
} from "src/entities/models/Supplier";
import { format } from "date-fns";
import { createSupplierUseCase } from "src/application/use-cases/suppliers/create-supplier.use-case";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Response";

const presenter = (supplier: Omit<SupplierSchema, "containers">) => {
  const date_format = "MMM dd, yyyy";

  return {
    ...supplier,
    created_at: format(supplier.created_at, date_format),
    updated_at: format(supplier.updated_at, date_format),
    deleted_at: supplier.deleted_at
      ? format(supplier.deleted_at, date_format)
      : null,
  };
};

export const CreateSupplierController = async (
  input: Partial<SupplierInsertSchema>
) => {
  try {
    const { data, error: inputParseError } =
      SupplierInsertSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const supplier = await createSupplierUseCase(data);
    return ok(presenter(supplier));
  } catch (error) {
    if (error instanceof InputParseError) {
      return err({
        message: error.message,
        cause: error.cause,
      });
    }

    if (error instanceof DatabaseOperationError) {
      return err({
        message: "Server Error",
        cause: error.message,
      });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
