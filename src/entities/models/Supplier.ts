import { Prisma } from "@prisma/client";
import { z } from "zod";
import { ContainerWithAllRow } from "./Container";

export type SupplierRow = Prisma.suppliersGetPayload<object>;

export type SupplierWithContainersRow = Prisma.suppliersGetPayload<{
  include: { containers: { include: { inventories: true; branch: true } } };
}>;

export type Supplier = {
  supplier_id: string;
  name: string;
  supplier_code: string;
  japanese_name: string;
  commission: string;
  sales_remittance_account: string;
  shipper: string;
  email: string;
  contact_number: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  containers: ContainerWithAllRow[];
};

export const createSupplierSchema = z.object({
  name: z.string(),
  supplier_code: z.string(),
  japanese_name: z.string().optional().nullable(),
  shipper: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  sales_remittance_account: z.string().optional().nullable(),
  commission: z.string().optional().nullable(),
  contact_number: z.string().optional().nullable(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
