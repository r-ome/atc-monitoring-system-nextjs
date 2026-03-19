import { NotFoundError } from "src/entities/errors/common";
import { SupplierRepository } from "src/infrastructure/di/repositories";

export const getSupplierBySupplierCodeUseCase = async (
  supplier_code: string
) => {
  const supplier = await SupplierRepository.getSupplierBySupplierCode(
    supplier_code
  );

  if (!supplier) {
    throw new NotFoundError("Supplier not found!", {
      cause: `Supplier ${supplier_code} does not exist`,
    });
  }
  return supplier;
};
