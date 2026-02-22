import { CreateSupplierInput } from "src/entities/models/Supplier";
import { SupplierRepository } from "src/infrastructure/repositories/suppliers.repository";

export const createSupplierUseCase = async (supplier: CreateSupplierInput) => {
  return await SupplierRepository.createSupplier(supplier);
};
