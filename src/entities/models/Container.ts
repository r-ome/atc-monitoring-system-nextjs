import { z } from "zod";
import { Prisma } from "@prisma/client";
import { Inventory } from "./Inventory";
import { Branch } from "./Branch";

export type BaseContainerSchema = Prisma.containersGetPayload<{
  include: { branch: true; inventories: true; supplier: true };
}>;
export type ContainerSchema = Prisma.containersGetPayload<{
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

export const ContainerInsertSchema = z.object({
  supplier_id: z.string(),
  branch_id: z.string(),
  barcode: z.string(),
  bill_of_lading_number: z.string().optional().nullable(),
  container_number: z.string().optional().nullable(),
  arrival_date: z.date().optional().nullable(),
  due_date: z.date().optional().nullable(),
  gross_weight: z.string().optional().nullable(),
  auction_or_sell: z.enum(["AUCTION", "SELL"]),
  duties_and_taxes: z.coerce.number().nullable(),
});

export type ContainerInsertSchema = z.infer<typeof ContainerInsertSchema>;

export type ContainerDueDate = {
  container_id: string;
  barcode: string;
  bill_of_lading_number: string;
  container_number: string;
  arrival_date: string;
  due_date: string;
  branch: Branch;
};
