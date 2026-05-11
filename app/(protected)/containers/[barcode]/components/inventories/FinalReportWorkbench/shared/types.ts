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
  | "auto-resolved"
  | "splits"
  | "tax"
  | "generate";

export const STEP_ORDER: StepKey[] = [
  "setup",
  "unsold-overview",
  "qty-split",
  "bought-items",
  "auto-resolved",
  "splits",
  "tax",
  "generate",
];

export const STEP_LABEL: Record<StepKey, string> = {
  setup: "Setup",
  "unsold-overview": "UNSOLD Items",
  "qty-split": "Qty Split",
  "bought-items": "Bought Items",
  "auto-resolved": "Auto-resolved",
  splits: "Splits",
  tax: "Container Tax",
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
  shouldShowExcludeBidder740: boolean;
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
      return preview.unsold_items.length > 0;
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
    case "auto-resolved":
      return (
        preview.auto_resolved.length > 0 || draftHas((d) => d.matches.length > 0)
      );
    case "splits":
      return (
        preview.split_candidates.length > 0 ||
        draftHas((d) => d.split_selections.length > 0)
      );
    case "tax":
      return preview.options.deduct_thirty_k;
    case "generate":
      return true;
  }
};
