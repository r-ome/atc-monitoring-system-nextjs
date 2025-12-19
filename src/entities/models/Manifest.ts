import { z } from "zod";

import { Prisma } from "@prisma/client";

export type ManifestSchema = Prisma.manifest_recordsGetPayload<object>;
export type Manifest = {
  manifest_id: string;
  auction_id: string;
  barcode: string | null;
  control: string | null;
  description: string | null;
  price: string | null;
  bidder_number: string | null;
  qty: string | null;
  manifest_number: string | null;
  remarks: string | null;
  is_slash_item: string | null;
  error_message: string | null;
  created_at: string;
};

export type ManifestSheetRecord = Record<
  | "BARCODE"
  | "CONTROL"
  | "DESCRIPTION"
  | "BIDDER"
  | "PRICE"
  | "QTY"
  | "MANIFEST",
  string
>;

export const ManifestInsertSchema = z.object({
  BARCODE: z.string(),
  CONTROL: z.string(),
  DESCRIPTION: z.string(),
  BIDDER: z.string(),
  PRICE: z.coerce.string(),
  QTY: z.coerce.string(),
  MANIFEST: z.string().optional().nullable(),
  auction_bidder_id: z.string().optional().nullable(),
  service_charge: z.number().optional().nullable(),
  container_id: z.string().optional().nullable(),
  inventory_id: z.string().optional().nullable(),
  isValid: z.boolean(),
  forUpdating: z.boolean(),
  status: z.string().optional(),
  isSlashItem: z.string().nullable(),
  auction_inventory_id: z.string().optional().nullable(),
  error: z.string(),
});

export type ManifestInsertSchema = z.infer<typeof ManifestInsertSchema>;

export type BoughtItemsSheetRecord = Record<
  "BARCODE" | "CONTROL" | "DESCRIPTION" | "OLD_PRICE" | "NEW_PRICE",
  string
>;

export const ManifestUpdateSchema = z.object({
  manifest_id: z.string(),
  barcode: z.string(),
  control: z.string(),
  description: z.string(),
  bidder_number: z.string(),
  price: z.coerce.string(),
  qty: z.coerce.string(),
  manifest_number: z.string().optional().nullable(),
  auction_bidder_id: z.string().optional().nullable(),
  service_charge: z.number().optional().nullable(),
  inventory_id: z.string().optional().nullable(),
  container_id: z.string().optional().nullable(),
  isValid: z.boolean().optional(),
  error: z.string(),
});

export type ManifestUpdateSchema = z.infer<typeof ManifestUpdateSchema>;
