import { containers } from "@prisma/client";
import { ContainerSchema } from "src/entities/models/Container";
import {
  SupplierInsertSchema,
  SupplierSchema,
} from "src/entities/models/Supplier";

export interface ISupplierRepository {
  getSupplierBySupplierId: (
    supplier_id: string
  ) => Promise<SupplierSchema | null>;
  getSupplierBySupplierCode: (
    supplier_code: string
  ) => Promise<SupplierSchema | null>;
  getSuppliers: () => Promise<Omit<SupplierSchema, "containers">[]>;
  createSupplier: (
    supplier: SupplierInsertSchema
  ) => Promise<Omit<SupplierSchema, "containers">>;
  getSupplierContainers: (
    supplier_id: string
  ) => Promise<SupplierSchema | null>;
  updateSupplier: (
    supplier_id: string,
    data: SupplierInsertSchema
  ) => Promise<Omit<SupplierSchema, "containers">>;
}
