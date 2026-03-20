import { z } from "zod";
import { Prisma } from "@prisma/client";
import { Inventory } from "./Inventory";
import { Branch } from "./Branch";

export type ContainerRow = Prisma.containersGetPayload<object>;

export type ContainerWithBranchRow = Prisma.containersGetPayload<{
  include: { branch: true };
}>;

export type ContainerWithSupplierAndBranchRow = Prisma.containersGetPayload<{
  include: { branch: true; supplier: true };
}>;

export type ContainerWithInventoriesRow = Prisma.containersGetPayload<{
  include: { inventories: true };
}>;

export type ContainerWithAllRow = Prisma.containersGetPayload<{
  include: { branch: true; inventories: true; supplier: true };
}>;

export type ContainerBarcodeRow = Prisma.containersGetPayload<{
  select: { container_id: true; barcode: true };
}>;

export type ContainerListRow = Prisma.containersGetPayload<{
  include: {
    branch: { select: { branch_id: true; name: true } };
    supplier: { select: { supplier_id: true; supplier_code: true; name: true } };
    _count: { select: { inventories: true } };
  };
}>;

export type ContainerWithDetailsRow = Prisma.containersGetPayload<{
  include: {
    branch: true;
    inventories: {
      include: {
        auctions_inventory: {
          include: { auction_bidder: { include: { bidder: true } } };
        };
      };
    };
    supplier: true;
  };
}>;

export type Container = {
  container_id: string;
  barcode: string;
  supplier_id: string;
  branch_id: string;
  supplier: {
    supplier_id: string;
    name: string;
  };
  branch: {
    branch_id: string;
    name: string;
  };
  duties_and_taxes: number;
  bill_of_lading_number: string;
  container_number: string;
  gross_weight: string;
  arrival_date?: string;
  auction_start_date?: string;
  due_date?: string;
  auction_or_sell: "AUCTION" | "SELL";
  status: "PAID" | "UNPAID";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  inventories: Inventory[];
};

export const createContainerSchema = z.object({
  supplier_id: z.string().min(1),
  branch_id: z.string().min(1),
  barcode: z.string().min(1),
  bill_of_lading_number: z.string().optional().nullable(),
  container_number: z.string().optional().nullable(),
  arrival_date: z.date().optional().nullable(),
  due_date: z.date().optional().nullable(),
  gross_weight: z.string().optional().nullable(),
  auction_or_sell: z.enum(["AUCTION", "SELL"]),
  duties_and_taxes: z.coerce.number().nullable(),
});

export type CreateContainerInput = z.infer<typeof createContainerSchema>;

export const updateContainerSchema = z.object({
  supplier_id: z.string().min(1),
  branch_id: z.string().min(1),
  barcode: z.string().min(1),
  bill_of_lading_number: z.string().optional().nullable(),
  container_number: z.string().optional().nullable(),
  arrival_date: z.date().optional().nullable(),
  due_date: z.date().optional().nullable(),
  gross_weight: z.string().optional().nullable(),
  auction_or_sell: z.enum(["AUCTION", "SELL"]),
  duties_and_taxes: z.coerce.number().nullable(),
});

export type UpdateContainerInput = z.infer<typeof updateContainerSchema>;

export type ContainerDueDate = {
  container_id: string;
  barcode: string;
  bill_of_lading_number: string;
  container_number: string;
  arrival_date: string;
  due_date: string;
  branch: Branch;
};
