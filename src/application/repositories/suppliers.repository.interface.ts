import {
  SupplierRow,
  SupplierWithContainerBarcodesRow,
  SupplierWithContainersRow,
  SupplierWithCountRow,
  CreateSupplierInput,
  UpdateSupplierInput,
} from "src/entities/models/Supplier";

export interface ISupplierRepository {
  getSupplierBySupplierId(supplier_id: string): Promise<SupplierWithContainerBarcodesRow | null>;
  getSupplierBySupplierCode(supplier_code: string): Promise<SupplierWithContainersRow | null>;
  getSuppliers(): Promise<SupplierWithCountRow[]>;
  createSupplier(supplier: CreateSupplierInput): Promise<SupplierRow>;
  updateSupplier(supplier_id: string, data: UpdateSupplierInput): Promise<SupplierRow>;
}
