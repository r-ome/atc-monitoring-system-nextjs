import {
  SupplierRow,
  SupplierWithContainersRow,
  CreateSupplierInput,
} from "src/entities/models/Supplier";

export interface ISupplierRepository {
  getSupplierBySupplierId(supplier_id: string): Promise<SupplierWithContainersRow | null>;
  getSupplierBySupplierCode(supplier_code: string): Promise<SupplierWithContainersRow | null>;
  getSuppliers(): Promise<SupplierRow[]>;
  createSupplier(supplier: CreateSupplierInput): Promise<SupplierRow>;
  getSupplierContainers(supplier_id: string): Promise<SupplierWithContainersRow | null>;
  updateSupplier(supplier_id: string, data: CreateSupplierInput): Promise<SupplierRow>;
}
