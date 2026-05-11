import { z } from "zod";
import {
  finalReportMatchSchema,
  finalReportCounterCheckMatchSchema,
  finalReportAddOnSchema,
  applyFinalReportQtySplitSchema,
} from "./FinalReport";

const warehouseBoughtItemSchema = z.object({
  barcode: z.string().min(1),
  control: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().positive(),
});

const taxEditEntrySchema = z.object({
  barcode: z.string().min(1),
  control: z.string(),
  deducted_amount: z.coerce.number().nonnegative(),
});

export type FinalReportDraftTaxEdit = z.infer<typeof taxEditEntrySchema>;

export const FINAL_REPORT_DRAFT_VERSION = 1;

export const finalReportDraftOptionsSchema = z.object({
  selected_dates: z.array(z.string().min(1)),
  exclude_bidder_740: z.boolean(),
  exclude_refunded_bidder_5013: z.boolean(),
  deduct_thirty_k: z.boolean(),
});

// Draft-only carry-along fields for synthesizing monitoring rows during preview
// without per-row DB lookups. Replay uses only the original schemas' fields.
const monitoringContextSchema = z.object({
  auction_id: z.string().min(1),
  auction_bidder_id: z.string().min(1),
  bidder_number: z.string().min(1),
  auction_date: z.string().min(1),
});

export const finalReportDraftBoughtItemDecisionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("VOID"),
    inventory_id: z.string().min(1),
  }),
  z
    .object({
      action: z.literal("BOUGHT"),
      inventory_id: z.string().min(1),
      auction_id: z.string().min(1),
      price: z.coerce.number().positive(),
      qty: z.string().min(1),
    })
    .merge(monitoringContextSchema.omit({ auction_id: true })),
]);

export const finalReportDraftCounterCheckMatchSchema =
  finalReportCounterCheckMatchSchema.merge(
    monitoringContextSchema.pick({ auction_id: true, bidder_number: true }),
  );

export const finalReportDraftAddOnSchema = finalReportAddOnSchema.merge(
  monitoringContextSchema.pick({ auction_id: true, bidder_number: true }),
);

export const finalReportDraftSchema = z.object({
  version: z.literal(FINAL_REPORT_DRAFT_VERSION),
  options: finalReportDraftOptionsSchema,
  bought_items: z.array(finalReportDraftBoughtItemDecisionSchema),
  matches: z.array(finalReportMatchSchema),
  counter_check_matches: z.array(finalReportDraftCounterCheckMatchSchema),
  qty_splits: z.array(applyFinalReportQtySplitSchema),
  warehouse_add_ons: z.array(finalReportDraftAddOnSchema),
  warehouse_bought_items: z.array(warehouseBoughtItemSchema),
  warehouse_bought_items_branch_id: z.string().nullable(),
  split_selections: z.array(z.string().min(1)),
  tax_edits: z.array(taxEditEntrySchema),
  updated_at: z.string(),
});

export type FinalReportDraft = z.infer<typeof finalReportDraftSchema>;
export type FinalReportDraftOptions = z.infer<typeof finalReportDraftOptionsSchema>;
export type FinalReportDraftBoughtItemDecision = z.infer<
  typeof finalReportDraftBoughtItemDecisionSchema
>;

export const saveFinalReportDraftSchema = z.object({
  container_id: z.string().min(1),
  draft: finalReportDraftSchema,
});

export type SaveFinalReportDraftInput = z.infer<typeof saveFinalReportDraftSchema>;

export const emptyFinalReportDraft = (options: FinalReportDraftOptions): FinalReportDraft => ({
  version: FINAL_REPORT_DRAFT_VERSION,
  options,
  bought_items: [],
  matches: [],
  counter_check_matches: [],
  qty_splits: [],
  warehouse_add_ons: [],
  warehouse_bought_items: [],
  warehouse_bought_items_branch_id: null,
  split_selections: [],
  tax_edits: [],
  updated_at: new Date().toISOString(),
});
