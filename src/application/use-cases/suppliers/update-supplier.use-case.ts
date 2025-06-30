import { SupplierInsertSchema } from "src/entities/models/Supplier";
import { SupplierRepository } from "src/infrastructure/repositories/suppliers.repository";
import { getSupplierBySupplierIdUseCase } from "./get-supplier-by-supplier-id.use-case";
import { getSupplierBySupplierCodeUseCase } from "./get-supplier-by-supplier-code.use-case";
import { InputParseError } from "src/entities/errors/common";

export const updateSupplierUseCase = async (
  supplier_id: string,
  data: SupplierInsertSchema
) => {
  await getSupplierBySupplierIdUseCase(supplier_id);

  const supplier_barcode = await getSupplierBySupplierCodeUseCase(
    data.supplier_code
  );

  if (supplier_barcode.supplier_id !== supplier_id && supplier_barcode) {
    throw new InputParseError("Invalid Data!", {
      cause: { supplier_code: ["Barcode already exist!"] },
    });
  }

  return SupplierRepository.updateSupplier(supplier_id, data);
};
