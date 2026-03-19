import { UpdateSupplierInput } from "src/entities/models/Supplier";
import { SupplierRepository } from "src/infrastructure/di/repositories";
import { getSupplierBySupplierIdUseCase } from "./get-supplier-by-supplier-id.use-case";
import { InputParseError } from "src/entities/errors/common";

export const updateSupplierUseCase = async (
  supplier_id: string,
  data: UpdateSupplierInput,
) => {
  await getSupplierBySupplierIdUseCase(supplier_id);

  const existing = await SupplierRepository.getSupplierBySupplierCode(
    data.supplier_code,
  );

  if (existing && existing.supplier_id !== supplier_id) {
    throw new InputParseError("Invalid Data!", {
      cause: { supplier_code: ["Supplier code already exists!"] },
    });
  }

  return SupplierRepository.updateSupplier(supplier_id, data);
};
