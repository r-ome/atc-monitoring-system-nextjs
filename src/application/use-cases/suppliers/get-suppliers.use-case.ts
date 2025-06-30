import { SupplierRepository } from "src/infrastructure/repositories/suppliers.repository";

export const getSuppliersUseCase = async () => {
  return await SupplierRepository.getSuppliers();
};
