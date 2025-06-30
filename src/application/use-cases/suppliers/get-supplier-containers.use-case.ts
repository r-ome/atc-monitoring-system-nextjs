import { NotFoundError } from "src/entities/errors/common";
import { SupplierRepository } from "src/infrastructure/repositories/suppliers.repository";

export const getSupplierContainersUseCase = async (supplier_id: string) => {
  const supplier = await SupplierRepository.getSupplierContainers(supplier_id);
  if (!supplier) {
    throw new NotFoundError("Supplier not found!");
  }
  return supplier;
};
