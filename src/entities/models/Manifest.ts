import { z } from "zod";

import { Prisma } from "@prisma/client";

export type ManifestSchema = Prisma.manifest_recordsGetPayload<{}>;
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
  forReassign: z.boolean(),
  auction_inventory_id: z.string().optional().nullable(),
  error: z.string(),
});

export type ManifestInsertSchema = z.infer<typeof ManifestInsertSchema>;

export type BoughtItemsSheetRecord = Record<
  "BARCODE" | "CONTROL" | "DESCRIPTION" | "OLD_PRICE" | "NEW_PRICE",
  string
>;
