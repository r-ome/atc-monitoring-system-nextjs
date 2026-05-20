import type { Dispatch, SetStateAction } from "react";
import type { FinalReportPreview } from "src/entities/models/FinalReport";
import type { FinalReportDraft } from "src/entities/models/FinalReportDraft";
import type { ContainerReportSheet } from "src/entities/models/Container";
import type { InventoryRowType } from "../../ContainerInventoriesTable";

export type StepKey =
  | "setup"
  | "unsold-overview"
  | "qty-split"
  | "bought-items"
  | "tax"
  | "append-inventories"
  | "generate";

export const STEP_ORDER: StepKey[] = [
  "setup",
  "unsold-overview",
  "qty-split",
  "bought-items",
  "tax",
  "append-inventories",
  "generate",
];

export const STEP_LABEL: Record<StepKey, string> = {
  setup: "Setup",
  "unsold-overview": "UNSOLD Items",
  "qty-split": "Qty Split",
  "bought-items": "Bought Items",
  tax: "Container Tax",
  "append-inventories": "Append Inventories",
  generate: "Generate",
};

export type WizardOptions = {
  selected_dates: string[];
  exclude_bidder_740: boolean;
  exclude_refunded_bidder_5013: boolean;
  deduct_thirty_k: boolean;
};

export type WizardState = {
  step: StepKey;
  options: WizardOptions;
  preview: FinalReportPreview | null;
  draft: FinalReportDraft;
  splitSelections: string[];
  loading: string | null;
  warehouseDecisions: Record<string, "LEAVE_UNSOLD">;
};

export type StepProps = {
  state: WizardState;
  setState: Dispatch<SetStateAction<WizardState>>;
  preview: FinalReportPreview | null;
  refresh: () => Promise<FinalReportPreview | null>;
  routerRefresh: () => void;
  visibleSteps: StepKey[];
  goNext: () => void;
  goBack: () => void;
  goTo: (step: StepKey) => void;
  jumpDisabled: (step: StepKey) => boolean;
  setLoading: (msg: string | null) => void;
  loading: string | null;
  container: {
    container_id: string;
    supplier: { name: string };
    barcode: string;
  };
  userBranchId: string;
  inventories: InventoryRowType[];
  sheets: ContainerReportSheet[];
  saveDraft: (next: FinalReportDraft) => Promise<void>;
};

export const stepHasWork = (
  step: StepKey,
  preview: FinalReportPreview | null,
  warehouseDecisions: Record<string, "LEAVE_UNSOLD">,
  draft?: FinalReportDraft,
): boolean => {
  if (!preview) return step === "setup";
  // A step stays visible if either (a) there's pending work for it, or
  // (b) the user has already staged decisions for it in the draft and may want
  // to revisit them.
  const draftHas = (predicate: (d: FinalReportDraft) => boolean) =>
    Boolean(draft && predicate(draft));

  switch (step) {
    case "setup":
      return true;
    case "unsold-overview":
      return (
        preview.unsold_items.length > 0 ||
        draftHas((d) => d.merged_inventories.length > 0)
      );
    case "qty-split":
      return (
        (preview.unsold_items.length > 0 &&
          preview.report.monitoring.length > 0) ||
        draftHas((d) => d.qty_splits.length > 0)
      );
    case "bought-items":
      return (
        preview.unsold_items.length > 0 ||
        draftHas((d) => d.bought_items.length > 0)
      );
    case "tax":
      return preview.options.deduct_thirty_k && preview.unsold_items.length === 0;
    case "append-inventories":
      return (
        preview.appendable_unsold_items.length > 0 ||
        draftHas((d) => d.appended_inventory_ids.length > 0)
      );
    case "generate":
      return true;
  }
};
