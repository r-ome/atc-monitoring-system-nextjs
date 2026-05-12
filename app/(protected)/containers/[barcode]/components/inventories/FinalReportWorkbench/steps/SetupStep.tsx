"use client";

import { StepShell } from "../shared/StepShell";
import { StepProps, STEP_ORDER, stepHasWork } from "../shared/types";

export const SetupStep = ({
  state,
  setState,
  preview,
  refresh,
  saveDraft,
  visibleSteps,
  goBack,
  goTo,
  jumpDisabled,
  loading,
}: StepProps) => {
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
      nextLabel={preview ? "Save & Re-build Preview" : "Save & Build Preview"}
      nextDisabled={!state.options.selected_dates.length}
      loading={loading}
      description="Final reports include all auction dates for this container. Build a preview, then review the steps that have work."
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
          <p className="text-sm text-muted-foreground">
            All auction dates are included automatically.
          </p>
          <p className="text-xs">
            {state.options.selected_dates.length} date
            {state.options.selected_dates.length === 1 ? "" : "s"} selected
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Preview</p>
          <p className="text-sm text-muted-foreground">
            REFUNDED rows from Bidder 5013 are removed automatically.
          </p>

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
