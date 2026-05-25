import type { Dispatch, SetStateAction } from "react";
import type {
  FinalReportPreview,
  FinalReportOptionsInput,
} from "src/entities/models/FinalReport";
import type { FinalReportDraft } from "src/entities/models/FinalReportDraft";
import type { ContainerReportSheet } from "src/entities/models/Container";

export type V2StepKey =
  | "setup"
  | "resolve"
  | "tax"
  | "append"
  | "preview"
  | "finalize";

export const V2_STEP_ORDER: V2StepKey[] = [
  "setup",
  "resolve",
  "tax",
  "append",
  "preview",
  "finalize",
];

export const V2_STEP_META: Record<
  V2StepKey,
  { n: number; title: string; sub: string }
> = {
  setup: { n: 1, title: "Setup", sub: "Container info" },
  resolve: { n: 2, title: "Resolve items", sub: "Fix any issues" },
  tax: { n: 3, title: "Container tax", sub: "Deduct ₱30,000" },
  append: { n: 4, title: "Append items", sub: "Give new barcodes" },
  preview: { n: 5, title: "Preview report", sub: "Check the file" },
  finalize: { n: 6, title: "Finalize", sub: "Lock it in" },
};

export type V2WizardOptions = Omit<FinalReportOptionsInput, "barcode">;

export type V2ContainerContext = {
  container_id: string;
  barcode: string;
  // Includes the remittance account because the workbook's BILL sheet picks
  // between the MILLENNIUM and ATC layouts off of it.
  supplier: { name: string; sales_remittance_account: string };
  branch_name: string | null;
  duties_and_taxes: number;
  // Needed by the BILL sheet for the description/BL line.
  arrival_date: string;
  bill_of_lading_number: string;
  // Needed by the FINAL COMPUTATION sheet for the payment schedule cell.
  due_date: string;
};

export type V2BreakdownInventory = {
  auction_date?: string | null;
  sales_allocation?: string | null;
  auctions_inventory: {
    status: string;
    price: number;
    bidder?: { bidder_number?: string | null } | null;
  } | null;
};

export type V2WizardState = {
  step: V2StepKey;
  options: V2WizardOptions;
  draft: FinalReportDraft;
  loading: string | null;
  // Flips to true once finalizeFinalReport has succeeded. The wizard hides
  // Back / Save & exit / rail jumps after this so the user can't navigate
  // back to Preview/Resolve and act on stale draft/preview state for a
  // container that's already been finalized server-side.
  finalized: boolean;
};

export type V2StepProps = {
  state: V2WizardState;
  setState: Dispatch<SetStateAction<V2WizardState>>;
  preview: FinalReportPreview | null;
  previewLoading: boolean;
  // Flips to true after the initial getFinalReportDraft resolves. Steps
  // that surface their own write-triggering CTAs (e.g. SetupStep's
  // "Heads up" callout) should gate them on this so an early click can't
  // race the draft load and overwrite a saved draft.
  draftLoaded: boolean;
  refresh: () => Promise<FinalReportPreview | null>;
  saveDraft: (next: FinalReportDraft) => Promise<void>;
  // Lets a step register a function that runs when the wizard tries to leave
  // it (Next / Back / Save & exit / step rail jump). Returning the same fn
  // again is fine — re-registering replaces the previous one. The step is
  // responsible for clearing it on unmount or after a successful commit.
  registerBeforeLeave: (fn: (() => Promise<void>) | null) => void;
  goTo: (step: V2StepKey) => void | Promise<void>;
  goNext: () => void | Promise<void>;
  goBack: () => void | Promise<void>;
  container: V2ContainerContext;
  breakdownInventories: V2BreakdownInventory[];
  sheets: ContainerReportSheet[];
};
