import { z } from "zod";
import { type AuctionItemStatus } from "./Auction";
import { type InventoryStatus } from "./Inventory";

export const finalReportOptionsSchema = z.object({
  barcode: z.string().min(1),
  selected_dates: z.array(z.string().min(1)).min(1),
  exclude_bidder_740: z.boolean(),
  exclude_refunded_bidder_5013: z.boolean(),
  deduct_thirty_k: z.boolean(),
  // When true, the preview is computed from raw DB state only — the wizard's
  // saved draft (matches, bought items, tax edits, etc.) is ignored. Used by
  // the "Generate original report" path.
  ignore_draft: z.boolean().optional(),
});

export type FinalReportOptionsInput = z.infer<typeof finalReportOptionsSchema>;

export type FinalReportInventoryRow = {
  inventory_id: string;
  container_id: string;
  barcode: string;
  control: string;
  description: string;
  status: InventoryStatus;
  is_bought_item: number;
  auction_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  container: { container_id: string; barcode: string };
  auctions_inventory: {
    auction_inventory_id: string;
    auction_bidder_id: string;
    description: string;
    status: AuctionItemStatus;
    price: number;
    qty: string;
    manifest_number: string;
    auction_date: string;
    reason: string | null;
    auction_bidder: {
      bidder_id: string;
      bidder_number: string;
      full_name: string;
    };
  } | null;
};

export type FinalReportMonitoringRow = {
  auction_inventory_id: string;
  auction_bidder_id: string;
  inventory_id: string;
  auction_id: string;
  barcode: string;
  control: string;
  description: string;
  bidder_number: string;
  qty: string;
  price: number;
  status: InventoryStatus;
  auction_status: AuctionItemStatus;
  manifest_number: string | null;
  auction_date: string;
  was_bought_item: boolean;
  bought_item_price: number | null;
};

export type FinalReportCounterCheckMatch = {
  counter_check_id: string;
  auction_id: string;
  control: string | null;
  bidder_number: string | null;
  price: string | null;
  page: string | null;
  description: string | null;
};

export type FinalReportCandidate = {
  candidate_id: string;
  confidence: "AUTO" | "REVIEW" | "SPLIT";
  reason: string;
  score: number;
  unsold_item: FinalReportInventoryRow;
  monitoring_item: FinalReportMonitoringRow;
  counter_check_matches: FinalReportCounterCheckMatch[];
};

export type FinalReportAvailableBidder = {
  auction_bidder_id: string;
  auction_id: string;
  auction_date: string;
  bidder_number: string;
  full_name: string;
};

export type FinalReportCounterCheckCandidate = {
  candidate_id: string;
  reason: string;
  score: number;
  unsold_item: FinalReportInventoryRow;
  matches: FinalReportCounterCheckMatch[];
};

export type FinalReportDeductionItem = {
  control: string;
  description: string;
  bidder_number: string;
  original_price: number;
  deducted_amount: number;
};

export type ContainerTaxDeductionRecord = {
  applied_at: string;
  applied_by: string | null;
  options: {
    selected_dates: string[];
    exclude_bidder_740: boolean;
    exclude_refunded_bidder_5013: boolean;
  };
  items: FinalReportDeductionItem[];
};

export const applyContainerTaxDeductionSchema = z.object({
  container_id: z.string().min(1),
  options: z.object({
    selected_dates: z.array(z.string().min(1)).min(1),
    exclude_bidder_740: z.boolean(),
    exclude_refunded_bidder_5013: z.boolean(),
  }),
  items: z
    .array(
      z.object({
        control: z.string(),
        description: z.string(),
        bidder_number: z.string(),
        original_price: z.coerce.number(),
        deducted_amount: z.coerce.number(),
      }),
    )
    .min(1),
});

export type ApplyContainerTaxDeductionInput = z.infer<
  typeof applyContainerTaxDeductionSchema
>;

export const clearContainerTaxDeductionSchema = z.object({
  container_id: z.string().min(1),
});

export type ClearContainerTaxDeductionInput = z.infer<
  typeof clearContainerTaxDeductionSchema
>;

export type FinalReportPreview = {
  options: FinalReportOptionsInput;
  sheet_details: {
    container_id: string;
    barcode: string;
    supplier: {
      supplier_id: string;
      name: string;
      sales_remittance_account: string;
    };
  };
  auction_dates: Record<string, number>;
  unsold_items: FinalReportInventoryRow[];
  auto_resolved: FinalReportCandidate[];
  split_candidates: FinalReportCandidate[];
  counter_check_candidates: FinalReportCounterCheckCandidate[];
  warehouse_check_items: FinalReportInventoryRow[];
  decisions: Record<string, FinalReportDecision>;
  tax_deduction_persisted: boolean;
  available_bidders: FinalReportAvailableBidder[];
  report: {
    monitoring: FinalReportMonitoringRow[];
    inventories: FinalReportInventoryRow[];
    deductions: FinalReportDeductionItem[];
  };
};

export type FinalReportDecision =
  | "MATCHED_2PART"
  | "MATCHED_COUNTER_CHECK"
  | "ADD_ON"
  | "BOUGHT_ITEM"
  | "COUNTER_CHECK_PENDING"
  | "SPLIT_PENDING"
  | "WAREHOUSE_PENDING";

export const finalReportMatchSchema = z.object({
  auction_inventory_id: z.string().min(1),
  source_inventory_id: z.string().min(1),
  target_inventory_id: z.string().min(1),
  price: z.coerce.number(),
  qty: z.string().min(1),
  description: z.string().min(1),
});

export const applyFinalReportMatchesSchema = z.object({
  matches: z.array(finalReportMatchSchema).min(1),
});

export type ApplyFinalReportMatchesInput = z.infer<
  typeof applyFinalReportMatchesSchema
>;

export const finalReportCounterCheckMatchSchema = z.object({
  inventory_id: z.string().min(1),
  auction_bidder_id: z.string().min(1),
  counter_check_id: z.string().min(1),
  price: z.coerce.number(),
  qty: z.string().min(1),
  description: z.string().min(1),
  manifest_number: z.string().default(""),
  auction_date: z.string().min(1),
});

export const applyFinalReportCounterCheckMatchesSchema = z.object({
  matches: z.array(finalReportCounterCheckMatchSchema).min(1),
});

export type ApplyFinalReportCounterCheckMatchesInput = z.infer<
  typeof applyFinalReportCounterCheckMatchesSchema
>;

export const finalReportAddOnSchema = z.object({
  inventory_id: z.string().min(1),
  auction_bidder_id: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  qty: z.string().min(1).default("1"),
  description: z.string().min(1),
  manifest_number: z.string().default(""),
  auction_date: z.string().min(1),
});

export const createFinalReportAddOnsSchema = z.object({
  items: z.array(finalReportAddOnSchema).min(1),
});

export type CreateFinalReportAddOnsInput = z.infer<
  typeof createFinalReportAddOnsSchema
>;

export const createFinalReportBoughtItemsSchema = z.object({
  branch_id: z.string().min(1),
  items: z
    .array(
      z.object({
        barcode: z.string().min(1),
        control: z.string().min(1),
        description: z.string().min(1),
        price: z.coerce.number().positive(),
      }),
    )
    .min(1),
});

export type CreateFinalReportBoughtItemsInput = z.infer<
  typeof createFinalReportBoughtItemsSchema
>;

export const applyFinalReportQtySplitSchema = z.object({
  source_auction_inventory_id: z.string().min(1),
  splits: z
    .array(
      z.object({
        target_inventory_id: z.string().min(1),
        price: z.coerce.number().positive(),
        qty: z.string().min(1),
      }),
    )
    .min(1),
});

export type ApplyFinalReportQtySplitInput = z.infer<
  typeof applyFinalReportQtySplitSchema
>;

export const applyFinalReportVoidSchema = z.object({
  inventory_id: z.string().min(1),
});
export type ApplyFinalReportVoidInput = z.infer<typeof applyFinalReportVoidSchema>;

export const applyFinalReportDirectBoughtSchema = z.object({
  inventory_id: z.string().min(1),
  auction_id: z.string().min(1),
  price: z.coerce.number().positive(),
  qty: z.string().min(1),
});
export type ApplyFinalReportDirectBoughtInput = z.infer<
  typeof applyFinalReportDirectBoughtSchema
>;
