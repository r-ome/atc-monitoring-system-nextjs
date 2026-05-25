"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageContainer } from "@/app/components/PageContainer";
import {
  getFinalReportDraft,
  saveFinalReportDraft,
} from "@/app/(protected)/containers/actions";
import {
  emptyFinalReportDraft,
  type FinalReportDraft,
} from "src/entities/models/FinalReportDraft";
import type { ContainerReportSheet } from "src/entities/models/Container";
import { usePreview } from "../components/inventories/FinalReportWorkbench/shared/usePreview";
import { Header } from "./shared/Header";
import { StepRail } from "./shared/StepRail";
import { Footer } from "./shared/Footer";
import { useDraftSavedIndicator } from "./shared/useDraftSavedIndicator";
import {
  V2_STEP_ORDER,
  type V2ContainerContext,
  type V2StepKey,
  type V2WizardState,
} from "./shared/types";
import { findResolution } from "./shared/resolution";
import { SetupStep } from "./steps/SetupStep";
import { ResolveStep } from "./steps/ResolveStep";
import { TaxStep } from "./steps/TaxStep";
import { AppendStep } from "./steps/AppendStep";
import { PreviewStep } from "./steps/PreviewStep";
import { FinalizeStep } from "./steps/FinalizeStep";

const SELECTED_SHEETS: ContainerReportSheet[] = [
  "monitoring",
  "final_computation",
  "unsold",
  "encode",
  "bill",
  "deductions",
];

type V2WizardProps = {
  container: V2ContainerContext;
  auctionDates: string[];
  breakdownInventories: import("./shared/types").V2BreakdownInventory[];
};

export const V2Wizard = ({
  container,
  auctionDates,
  breakdownInventories,
}: V2WizardProps) => {
  const router = useRouter();
  const { savedAgo, savedError, markSaved } = useDraftSavedIndicator();

  const defaultOptions = useMemo(
    () => ({
      selected_dates: auctionDates,
      exclude_bidder_740: true,
      exclude_refunded_bidder_5013: true,
      deduct_thirty_k: true,
    }),
    [auctionDates],
  );

  const [state, setState] = useState<V2WizardState>({
    step: "setup",
    options: defaultOptions,
    draft: emptyFinalReportDraft(defaultOptions),
    loading: null,
    finalized: false,
  });
  // Flips to true after getFinalReportDraft resolves (ok or not). Every
  // write path (Save & exit, footer primary, beforeLeave flush) waits on
  // this so an early click can't race the load and overwrite a saved draft
  // with the in-memory default.
  const [draftLoaded, setDraftLoaded] = useState(false);
  // Captures the error message from a failed getFinalReportDraft. While set,
  // draftLoaded stays false so every write path remains disabled, and the
  // wizard renders a blocking retry overlay instead of pretending we have a
  // clean slate (which would let the user overwrite the saved draft with an
  // empty default).
  const [draftLoadError, setDraftLoadError] = useState<string | null>(null);
  // Bumping this re-runs the draft-load effect.
  const [draftLoadAttempt, setDraftLoadAttempt] = useState(0);

  const { preview, loading: previewLoading, refresh: refreshRaw } = usePreview(
    container.barcode,
  );

  const normalize = useCallback(
    (draft: FinalReportDraft): FinalReportDraft => ({
      ...draft,
      options: { ...draft.options, ...defaultOptions },
    }),
    [defaultOptions],
  );

  // Load existing draft once (or on explicit retry).
  useEffect(() => {
    let cancelled = false;
    setDraftLoadError(null);
    (async () => {
      const res = await getFinalReportDraft(container.container_id);
      if (cancelled) return;
      if (!res.ok) {
        // Don't flip draftLoaded — a true here would unlock saveDraft / Next
        // / finalize, and the very next saveDraft would persist the empty
        // in-memory default over whatever the user already has saved.
        setDraftLoadError(res.error.message);
        return;
      }
      if (res.value) {
        const loaded = normalize(res.value);
        setState((prev) => ({
          ...prev,
          draft: loaded,
          options: loaded.options,
        }));
      }
      setDraftLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [container.container_id, normalize, draftLoadAttempt]);

  // Serialize HTTP saves so the server applies them in the order they were
  // initiated. The server replaces the whole draft on each call, so without
  // queueing, two in-flight saves can land in reverse order — a background
  // auto-save (e.g. centralized append staging) could clobber a user's
  // just-staged Resolve decision.
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const saveDraft = useCallback(
    async (next: FinalReportDraft) => {
      const normalized = normalize(next);
      setState((prev) => ({ ...prev, draft: normalized }));

      const prevJob = saveQueueRef.current;
      const job = (async () => {
        // Wait for the previous queued save to finish (regardless of outcome)
        // so the server sees writes in invocation order.
        try {
          await prevJob;
        } catch {
          // A prior failure already toasted; keep going so a new save
          // attempt isn't blocked by stale errors.
        }
        const res = await saveFinalReportDraft({
          container_id: container.container_id,
          draft: normalized,
        });
        markSaved(res.ok);
        if (!res.ok) {
          toast.error(res.error.message, {
            description:
              typeof res.error.cause === "string"
                ? res.error.cause
                : undefined,
          });
          // Throw so callers can short-circuit. Continuing after a failed
          // draft save would refresh/finalize against a stale server-side
          // draft and silently lose the user's just-made decision.
          throw new Error(res.error.message);
        }
      })();
      saveQueueRef.current = job;
      await job;
    },
    [container.container_id, normalize, markSaved],
  );

  const refresh = useCallback(async () => {
    return refreshRaw(state.options);
  }, [refreshRaw, state.options]);

  // Centralized append auto-staging: as soon as the draft is loaded and a
  // preview is available, ensure every appendable two-part SOLD row is
  // present in draft.appended_inventory_ids. This runs regardless of which
  // step the user navigates to, so rail jumps that skip AppendStep can't
  // result in a finalize that omits the virtual 3-part append rewriting.
  const appendableKey = preview?.appendable_unsold_items
    .map((i) => i.inventory_id)
    .join("|");
  useEffect(() => {
    if (!draftLoaded || !preview) return;
    const appendable = preview.appendable_unsold_items;
    if (appendable.length === 0) return;
    const draftIds = state.draft.appended_inventory_ids;
    const targetIds = appendable.map((i) => i.inventory_id);
    const next = [
      ...draftIds.filter((id) =>
        appendable.some((a) => a.inventory_id === id),
      ),
      ...targetIds.filter((id) => !draftIds.includes(id)),
    ];
    const same =
      next.length === draftIds.length &&
      next.every((id, i) => id === draftIds[i]);
    if (same) return;
    void (async () => {
      try {
        await saveDraft({ ...state.draft, appended_inventory_ids: next });
        await refresh();
      } catch {
        // saveDraft already toasted. The Finalize step's appendBlocked
        // guard will catch any unstaged rows so we can't finalize stale.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftLoaded, appendableKey]);

  // A step can register a function that runs (and is awaited) when the
  // wizard tries to leave the step. Used by the tax step to flush pending
  // edits in one save instead of debouncing per keystroke.
  const beforeLeaveRef = useRef<(() => Promise<void>) | null>(null);
  // Returns true if the registered commit succeeded (or there was none),
  // false if it failed. Callers should abort navigation on false so the
  // user doesn't move on with unsaved changes.
  const flushBeforeLeave = useCallback(async () => {
    const fn = beforeLeaveRef.current;
    if (!fn) return true;
    try {
      await fn();
      // Only clear on success. If the commit threw, the step is still
      // mounted with pending edits and its useEffect won't re-register
      // (the dependencies haven't changed). Leaving the handler in place
      // means the user's next Next/Back/Save & exit retries the commit
      // instead of silently skipping it.
      beforeLeaveRef.current = null;
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't save step changes.",
      );
      return false;
    }
  }, []);
  const registerBeforeLeave = useCallback(
    (fn: (() => Promise<void>) | null) => {
      beforeLeaveRef.current = fn;
    },
    [],
  );

  const goTo = useCallback(
    async (step: V2StepKey) => {
      const ok = await flushBeforeLeave();
      if (!ok) return;
      setState((prev) => ({ ...prev, step }));
    },
    [flushBeforeLeave],
  );

  const goNext = useCallback(async () => {
    const ok = await flushBeforeLeave();
    if (!ok) return;
    setState((prev) => {
      const idx = V2_STEP_ORDER.indexOf(prev.step);
      if (idx < 0 || idx + 1 >= V2_STEP_ORDER.length) return prev;
      return { ...prev, step: V2_STEP_ORDER[idx + 1] };
    });
  }, [flushBeforeLeave]);

  const goBack = useCallback(async () => {
    const ok = await flushBeforeLeave();
    if (!ok) return;
    setState((prev) => {
      const idx = V2_STEP_ORDER.indexOf(prev.step);
      if (idx <= 0) return prev;
      return { ...prev, step: V2_STEP_ORDER[idx - 1] };
    });
  }, [flushBeforeLeave]);

  // Generic guarded navigation: flush pending step edits before leaving.
  // Used by both Close/Save & exit (to the container detail) and the
  // header breadcrumbs (to /containers or the container detail).
  const navigateWithFlush = useCallback(
    async (href: string) => {
      if (draftLoaded) {
        const ok = await flushBeforeLeave();
        if (!ok) return;
      }
      router.push(href);
    },
    [draftLoaded, flushBeforeLeave, router],
  );
  const handleClose = useCallback(
    () => navigateWithFlush(`/containers/${container.barcode}`),
    [navigateWithFlush, container.barcode],
  );

  const stepProps = {
    state,
    setState,
    preview,
    previewLoading,
    draftLoaded,
    refresh,
    saveDraft,
    registerBeforeLeave,
    goTo,
    goNext,
    goBack,
    container,
    breakdownInventories,
    sheets: SELECTED_SHEETS,
  };

  // Per-step gating computed from preview + draft
  const unresolved = useMemo(() => {
    if (!preview) return 0;
    return preview.unsold_items.filter((item) => {
      const r = findResolution(state.draft, item.inventory_id);
      return !r;
    }).length;
  }, [preview, state.draft]);

  const taxApplied = useMemo(() => {
    if (!preview) return 0;
    const bidder0740 = preview.report.deductions
      .filter((d) => d.bidder_number === "0740")
      .reduce((sum, d) => sum + d.deducted_amount, 0);
    const editsTotal = state.draft.tax_edits.reduce(
      (sum, e) => sum + e.deducted_amount,
      0,
    );
    return bidder0740 + editsTotal;
  }, [preview, state.draft]);
  const taxStillNeeded = Math.max(0, 30000 - taxApplied);

  type PrimaryConfig = {
    label: string;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    warn?: string | null;
    hidden?: boolean;
  };

  const primaryByStep: Record<V2StepKey, PrimaryConfig> = {
    setup: { label: "Review items", onClick: goNext },
    resolve: {
      label: "Apply tax",
      onClick: goNext,
      disabled: unresolved > 0,
      warn:
        unresolved > 0
          ? `${unresolved} item${unresolved === 1 ? "" : "s"} still need a decision`
          : null,
    },
    tax: {
      label: "Append items",
      onClick: goNext,
      warn:
        taxStillNeeded > 0
          ? `₱${taxStillNeeded.toLocaleString()} of the tax target still uncovered`
          : null,
    },
    append: { label: "Preview report", onClick: goNext },
    preview: { label: "Go to finalize", onClick: goNext },
    finalize: {
      label: "",
      onClick: () => undefined,
      hidden: true,
    },
  };

  const currentPrimary = primaryByStep[state.step];
  const stepIndex = V2_STEP_ORDER.indexOf(state.step);

  return (
    <PageContainer>
      <Header
        container={container}
        savedAgo={savedAgo}
        savedError={savedError}
        onClose={handleClose}
        onNavigate={navigateWithFlush}
      />
      <div className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
      <StepRail
        current={state.step}
        onJump={goTo}
        // Mirror the footer's draftLoaded gate, and lock all jumps once the
        // container is finalized so the user can't navigate back to
        // Preview/Resolve and act on stale draft state.
        isStepEnabled={() => draftLoaded && !state.finalized}
      />

      <main className="relative flex flex-col">
        {draftLoadError ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/95 p-6 backdrop-blur-sm">
            <div className="flex max-w-[420px] flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
              <div className="text-[14px] font-semibold text-destructive">
                Couldn&apos;t load draft
              </div>
              <p className="text-[12.5px] text-muted-foreground">
                {draftLoadError}
              </p>
              <p className="text-[12px] text-muted-foreground">
                Editing is locked until we can confirm what&apos;s already
                saved for this container — otherwise saving now would
                overwrite it.
              </p>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/containers/${container.barcode}`)}
                  className="rounded-md border px-3 py-1.5 text-[12.5px] font-medium hover:bg-muted/60"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setDraftLoadAttempt((n) => n + 1)}
                  className="rounded-md bg-foreground px-3 py-1.5 text-[12.5px] font-semibold text-background hover:opacity-90"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {state.step === "setup" && <SetupStep {...stepProps} />}
        {state.step === "resolve" && <ResolveStep {...stepProps} />}
        {state.step === "tax" && <TaxStep {...stepProps} />}
        {state.step === "append" && <AppendStep {...stepProps} />}
        {state.step === "preview" && <PreviewStep {...stepProps} />}
        {state.step === "finalize" && <FinalizeStep {...stepProps} />}
      </main>

      <Footer
        leftLabel={stepIndex === 0 ? "Cancel" : "Back"}
        leftDisabled={!draftLoaded}
        // Once finalized, hide Back entirely so the user can't return to
        // Preview / Resolve and act on a draft the server has already
        // cleared. The FinalizeStep's success view exposes its own
        // navigation buttons (Back to container / All containers).
        onBack={
          state.finalized
            ? undefined
            : stepIndex === 0
              ? handleClose
              : goBack
        }
        rightLabel={currentPrimary.label}
        rightDisabled={currentPrimary.disabled || !draftLoaded}
        onPrimary={
          currentPrimary.hidden || state.finalized
            ? undefined
            : () => void currentPrimary.onClick()
        }
        // handleClose now performs the flush itself (so the header X and
        // Cancel routes don't drop pending tax edits either). Save & exit
        // delegates to it. Suppressed after finalize because there's
        // nothing left to save and we don't want to dangle a stale exit
        // path next to the success receipt.
        onSaveExit={state.finalized ? undefined : handleClose}
        saveExitDisabled={!draftLoaded}
        warn={currentPrimary.warn ?? null}
        loading={
          state.loading ??
          (!draftLoaded
            ? "Loading draft..."
            : previewLoading
              ? "Loading preview..."
              : null)
        }
      />
      </div>
    </PageContainer>
  );
};
