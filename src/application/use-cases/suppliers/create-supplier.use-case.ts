import { SupplierInsertSchema } from "src/entities/models/Supplier";
import { SupplierRepository } from "src/infrastructure/repositories/suppliers.repository";

export const createSupplierUseCase = async (supplier: SupplierInsertSchema) => {
  return await SupplierRepository.createSupplier(supplier);
};
