"use client";

import { useMemo } from "react";
import { Checkbox } from "@/app/components/ui/checkbox";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import { StepShell } from "../shared/StepShell";
import { StepProps, STEP_ORDER, stepHasWork } from "../shared/types";

export const SetupStep = ({
  state,
  setState,
  preview,
  refresh,
  saveDraft,
  visibleSteps,
  goNext,
  goBack,
  goTo,
  jumpDisabled,
  loading,
  shouldShowExcludeBidder740,
  inventories,
}: StepProps) => {
  const auctionDates = useMemo(() => {
    return inventories.reduce<Record<string, number>>((acc, item) => {
      if (!item.auctions_inventory || !item.auction_date) return acc;
      acc[item.auction_date] = (acc[item.auction_date] ?? 0) + 1;
      return acc;
    }, {});
  }, [inventories]);

  const setOption = <K extends keyof typeof state.options>(
    key: K,
    value: (typeof state.options)[K],
  ) =>
    setState((prev) => ({
      ...prev,
      options: { ...prev.options, [key]: value },
    }));

  const toggleDate = (date: string, checked: boolean) =>
    setState((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        selected_dates: checked
          ? prev.options.selected_dates.includes(date)
            ? prev.options.selected_dates
            : [...prev.options.selected_dates, date]
          : prev.options.selected_dates.filter((item) => item !== date),
      },
    }));

  const handlePreview = async () => {
    // Persist options into the draft so the preview reflects them on refresh.
    const nextDraft = { ...state.draft, options: state.options };
    await saveDraft(nextDraft);
    const nextPreview = await refresh();
    if (!nextPreview) return;
    // Compute visibleSteps from the freshly-returned preview directly — the
    // closure's `goNext` still sees stale state because React hasn't re-rendered yet.
    const freshVisible = STEP_ORDER.filter((step) => {
      if (step === "setup" || step === "generate") return true;
      return stepHasWork(step, nextPreview, state.warehouseDecisions, nextDraft);
    });
    const idx = freshVisible.indexOf("setup");
    if (idx >= 0 && idx + 1 < freshVisible.length) {
      goTo(freshVisible[idx + 1]);
    }
  };

  const pendingDecisionCount = preview
    ? Object.values(preview.decisions).filter((value) => value !== "MATCHED_2PART").length
    : 0;
  const canFastForward = preview !== null && pendingDecisionCount === 0;

  return (
    <StepShell
      step="setup"
      visibleSteps={visibleSteps}
      onBack={goBack}
      onJumpTo={goTo}
      jumpDisabled={jumpDisabled}
      backDisabled
      onNext={handlePreview}
      nextLabel={preview ? "Re-build preview" : "Build preview"}
      nextDisabled={!state.options.selected_dates.length}
      loading={loading}
      description="Pick the auction dates and toggles, then build a preview. The wizard will skip steps that have no work."
      rightSlot={
        canFastForward ? (
          <button
            type="button"
            className="text-xs underline"
            onClick={() =>
              setState((prev) => ({ ...prev, step: "generate" }))
            }
          >
            Skip to Generate
          </button>
        ) : null
      }
    >
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          <p className="text-sm font-medium">Auction dates</p>
          {Object.keys(auctionDates).length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No auctioned inventory found for this container.
            </p>
          ) : (
            Object.keys(auctionDates).map((date) => (
              <label
                key={date}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={state.options.selected_dates.includes(date)}
                  onCheckedChange={(checked) =>
                    toggleDate(date, checked === true)
                  }
                />
                <span>
                  {date} ({auctionDates[date]})
                </span>
              </label>
            ))
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Options</p>
          {shouldShowExcludeBidder740 ? (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={state.options.exclude_bidder_740}
                onCheckedChange={(checked) =>
                  setOption("exclude_bidder_740", checked === true)
                }
              />
              <span>Remove Bidder 740</span>
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={state.options.exclude_refunded_bidder_5013}
              onCheckedChange={(checked) =>
                setOption(
                  "exclude_refunded_bidder_5013",
                  checked === true,
                )
              }
            />
            <span>
              Remove REFUNDED items from Bidder {ATC_DEFAULT_BIDDER_NUMBER}
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={state.options.deduct_thirty_k}
              onCheckedChange={(checked) =>
                setOption("deduct_thirty_k", checked === true)
              }
            />
            <span>Less 30,000 Container Tax</span>
          </label>

          {preview ? (
            <div className="border rounded p-3 mt-3 text-xs space-y-1">
              <p className="font-medium">Preview snapshot</p>
              <p>Auto-resolved: {preview.auto_resolved.length}</p>
              <p>Split candidates: {preview.split_candidates.length}</p>
              <p>Tax persisted: {preview.tax_deduction_persisted ? "yes" : "no"}</p>
            </div>
          ) : null}
        </div>
      </div>
    </StepShell>
  );
};
