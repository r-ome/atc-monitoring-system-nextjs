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

  const appendableIds = new Set(
    preview?.appendable_unsold_items.map((item) => item.inventory_id) ?? [],
  );
  const stagedAppendCount = state.draft.appended_inventory_ids.filter((id) =>
    appendableIds.has(id),
  ).length;
  const canFastForward =
    preview !== null &&
    preview.unsold_items.length === 0 &&
    stagedAppendCount === preview.appendable_unsold_items.length;

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
            Resolve every UNSOLD item before finalizing. CANCELLED/REFUNDED rows
            must be corrected from the item profile or voided.
          </p>

          {preview ? (
              <div className="border rounded p-3 mt-3 text-xs space-y-1">
                <p className="font-medium">Preview snapshot</p>
                <p>UNSOLD items: {preview.unsold_items.length}</p>
                <p>Qty split candidates: {preview.split_candidates.length}</p>
                <p>SOLD two-part rows: {preview.appendable_unsold_items.length}</p>
                <p>Tax persisted: {preview.tax_deduction_persisted ? "yes" : "no"}</p>
              </div>
          ) : null}
        </div>
      </div>
    </StepShell>
  );
};
