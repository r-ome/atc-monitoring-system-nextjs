import { z } from "zod";
import { Prisma } from "@prisma/client";
import { Inventory, InventorySchema } from "./Inventory";

export type BaseContainerSchema = Prisma.containersGetPayload<{
  include: { branch: true; inventories: true; supplier: true };
}>;
export type ContainerSchema = Prisma.containersGetPayload<{
  include: {
    branch: true;
    inventories: {
      include: {
        auctions_inventories: {
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
  bill_of_lading_number: string;
  container_number: string;
  gross_weight: string;
  eta_to_ph?: string;
  departure_date?: string;
  arrival_date?: string;
  auction_start_date?: string;
  auction_end_date?: string;
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
  eta_to_ph: z.date().optional().nullable(),
  departure_date: z.date().optional().nullable(),
  arrival_date: z.date().optional().nullable(),
  auction_start_date: z.date().optional().nullable(),
  auction_end_date: z.date().optional().nullable(),
  due_date: z.date().optional().nullable(),
  gross_weight: z.string().optional().nullable(),
  auction_or_sell: z.enum(["AUCTION", "SELL"]),
});

export type ContainerInsertSchema = z.infer<typeof ContainerInsertSchema>;
// export type ContainerInsertSchema = Omit<
//   ContainerSchema,
//   | "container_id"
//   | "created_at"
//   | "updated_at"
//   | "deleted_at"
//   | "status"
//   | "auction_or_sell"
// >;

// export type BaseContainer = Override<
//   ContainerSchema,
//   {
//     eta_to_ph: string | null;
//     departure_date: string | null;
//     arrival_date: string | null;
//     auction_start_date: string | null;
//     auction_end_date: string | null;
//     due_date: string | null;
//     created_at: string;
//     updated_at: string;
//     deleted_at: string | null;
//   }
// >;

// export type ContainerListSchema = ContainerSchema & {
//   total_inventories: number;
//   total_sold_inventories: number;
//   inventories: InventorySchema[];
//   supplier: {
//     supplier_id: string;
//     name: string;
//     supplier_code: string;
//   };
// };

// export type ContainerList = BaseContainer & {
//   total_inventories: number;
//   total_sold_inventories: number;
//   supplier: {
//     supplier_id: string;
//     name: string;
//     supplier_code: string;
//   };
// };

// export type ContainerWithRelationsSchema = ContainerSchema & {
//   _count: {
//     inventories: number;
//   };
//   total_sold_inventories: number;
//   branch: {
//     branch_id: string;
//     name: string;
//   };
//   supplier: {
//     supplier_id: string;
//     name: string;
//     supplier_code: string;
//   };
// };

// export type ContainerWithRelations = BaseContainer & {
//   _count: {
//     inventories: number;
//   };
//   total_sold_inventories: number;
//   branch: {
//     branch_id: string;
//     name: string;
//   };
//   supplier: {
//     supplier_id: string;
//     name: string;
//     supplier_code: string;
//   };
// };
