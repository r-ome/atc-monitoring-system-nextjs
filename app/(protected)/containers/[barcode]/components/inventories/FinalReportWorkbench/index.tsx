"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { type ContainerReportSheet } from "src/entities/models/Container";
import {
  type FinalReportDraft,
  emptyFinalReportDraft,
} from "src/entities/models/FinalReportDraft";
import {
  getFinalReportDraft,
  saveFinalReportDraft,
} from "@/app/(protected)/containers/actions";
import { InventoryRowType } from "../ContainerInventoriesTable";
import { usePreview } from "./shared/usePreview";
import {
  STEP_ORDER,
  WizardState,
  StepKey,
  stepHasWork,
} from "./shared/types";
import { SetupStep } from "./steps/SetupStep";
import { UnsoldOverviewStep } from "./steps/UnsoldOverviewStep";
import { QtySplitStep } from "./steps/QtySplitStep";
import { BoughtItemsStep } from "./steps/BoughtItemsStep";
import { AutoResolvedStep } from "./steps/AutoResolvedStep";
import { SplitsStep } from "./steps/SplitsStep";
import { TaxStep } from "./steps/TaxStep";
import { GenerateStep } from "./steps/GenerateStep";

export const SELECTED_SHEETS: ContainerReportSheet[] = [
  "monitoring",
  "final_computation",
  "unsold",
  "encode",
  "bill",
  "deductions",
];

interface FinalReportWorkbenchProps {
  inventories: InventoryRowType[];
  container: {
    container_id: string;
    supplier: { name: string };
    barcode: string;
  };
  userBranchId: string;
  tarlacBranchId: string | null;
}

export const FinalReportWorkbench = ({
  inventories,
  container,
  userBranchId,
  tarlacBranchId,
}: FinalReportWorkbenchProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const shouldShowExcludeBidder740 = userBranchId !== tarlacBranchId;

  const allAuctionDates = useMemo(
    () =>
      Array.from(
        new Set(
          inventories
            .filter((item) => item.auctions_inventory && item.auction_date)
            .map((item) => item.auction_date as string),
        ),
      ),
    [inventories],
  );

  const defaultOptions = useMemo(
    () => ({
      selected_dates: allAuctionDates,
      exclude_bidder_740: shouldShowExcludeBidder740,
      exclude_refunded_bidder_5013: false,
      deduct_thirty_k: true,
    }),
    [allAuctionDates, shouldShowExcludeBidder740],
  );

  const [state, setState] = useState<WizardState>({
    step: "setup",
    options: defaultOptions,
    preview: null,
    draft: emptyFinalReportDraft(defaultOptions),
    splitSelections: [],
    loading: null,
    warehouseDecisions: {},
  });

  const { preview, loading, refresh, reset } = usePreview(container.barcode);

  const setLoading = (msg: string | null) =>
    setState((prev) => ({ ...prev, loading: msg }));

  const saveDraft = useCallback(
    async (next: FinalReportDraft) => {
      setState((prev) => ({ ...prev, draft: next }));
      const res = await saveFinalReportDraft({
        container_id: container.container_id,
        draft: next,
      });
      if (!res.ok) {
        toast.error(res.error.message, {
          description:
            typeof res.error.cause === "string" ? res.error.cause : undefined,
        });
      }
    },
    [container.container_id],
  );

  // Load existing draft when dialog opens. Wizard always starts at step 1, but
  // prior decisions are pre-filled so the user can review them.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const res = await getFinalReportDraft(container.container_id);
      if (cancelled || !res.ok) return;
      const loaded = res.value;
      if (loaded) {
        setState((prev) => ({
          ...prev,
          draft: loaded,
          options: {
            selected_dates: loaded.options.selected_dates,
            exclude_bidder_740: loaded.options.exclude_bidder_740,
            exclude_refunded_bidder_5013: loaded.options.exclude_refunded_bidder_5013,
            deduct_thirty_k: loaded.options.deduct_thirty_k,
          },
          splitSelections: loaded.split_selections,
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, container.container_id]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      reset();
      setState({
        step: "setup",
        options: defaultOptions,
        preview: null,
        draft: emptyFinalReportDraft(defaultOptions),
        splitSelections: [],
        loading: null,
        warehouseDecisions: {},
      });
    }
  };

  const visibleSteps = useMemo<StepKey[]>(() => {
    return STEP_ORDER.filter((step) => {
      if (step === "setup" || step === "generate") return true;
      return stepHasWork(step, preview, state.warehouseDecisions, state.draft);
    });
  }, [preview, state.warehouseDecisions, state.draft]);

  const goTo = (step: StepKey) => setState((prev) => ({ ...prev, step }));

  const goNext = () => {
    const idx = visibleSteps.indexOf(state.step);
    if (idx < 0 || idx + 1 >= visibleSteps.length) return;
    goTo(visibleSteps[idx + 1]);
  };

  const goBack = () => {
    const idx = visibleSteps.indexOf(state.step);
    if (idx <= 0) return;
    goTo(visibleSteps[idx - 1]);
  };

  const refreshPreview = async () => {
    const next = await refresh(state.options);
    if (next) {
      setState((prev) => ({
        ...prev,
        preview: next,
        splitSelections: prev.splitSelections.filter((id) =>
          next.split_candidates.some((candidate) => candidate.candidate_id === id),
        ),
      }));
    }
    return next;
  };

  const stepProps = {
    state,
    setState,
    preview,
    refresh: refreshPreview,
    routerRefresh: () => router.refresh(),
    visibleSteps,
    goNext,
    goBack,
    goTo,
    jumpDisabled: (target: StepKey) => target !== "setup" && !preview,
    setLoading,
    loading: loading ? "Loading preview..." : state.loading,
    container,
    userBranchId,
    shouldShowExcludeBidder740,
    inventories,
    sheets: SELECTED_SHEETS,
    saveDraft,
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Generate Final Report</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Final Report</DialogTitle>
        </DialogHeader>

        {state.step === "setup" && <SetupStep {...stepProps} />}
        {state.step === "unsold-overview" && <UnsoldOverviewStep {...stepProps} />}
        {state.step === "qty-split" && <QtySplitStep {...stepProps} />}
        {state.step === "bought-items" && <BoughtItemsStep {...stepProps} />}
        {state.step === "auto-resolved" && <AutoResolvedStep {...stepProps} />}
        {state.step === "splits" && <SplitsStep {...stepProps} />}
        {state.step === "tax" && <TaxStep {...stepProps} />}
        {state.step === "generate" && <GenerateStep {...stepProps} />}
      </DialogContent>
    </Dialog>
  );
};
