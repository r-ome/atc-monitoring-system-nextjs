"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { generateReport } from "@/app/lib/reports";
import {
  finalizeFinalReport,
  getFinalReportPreview,
  logContainerReport,
  uploadGeneratedFinalReportFiles,
} from "@/app/(protected)/containers/actions";
import { StepShell } from "../shared/StepShell";
import { StepProps } from "../shared/types";
import { buildReportData } from "../shared/buildReportData";
import type {
  FinalReportAvailableBidder,
  FinalReportMonitoringRow,
} from "src/entities/models/FinalReport";

// Swap each monitoring row with bidder_number "5013" to a random non-5013 bidder
// from the SAME auction. Rows in auctions with no other bidder are left untouched.
const reassign5013ToRandomBidders = (
  monitoring: FinalReportMonitoringRow[],
  availableBidders: FinalReportAvailableBidder[],
): { monitoring: FinalReportMonitoringRow[]; reassignedCount: number } => {
  const poolByAuction = new Map<string, FinalReportAvailableBidder[]>();
  for (const b of availableBidders) {
    if (b.bidder_number === "5013") continue;
    const arr = poolByAuction.get(b.auction_id) ?? [];
    arr.push(b);
    poolByAuction.set(b.auction_id, arr);
  }

  let reassignedCount = 0;
  const result = monitoring.map((row) => {
    if (row.bidder_number !== "5013") return row;
    const pool = poolByAuction.get(row.auction_id);
    if (!pool || pool.length === 0) return row;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    reassignedCount++;
    return {
      ...row,
      bidder_number: pick.bidder_number,
      auction_bidder_id: pick.auction_bidder_id,
    };
  });

  return { monitoring: result, reassignedCount };
};

export const GenerateStep = ({
  preview,
  visibleSteps,
  goBack,
  goTo,
  jumpDisabled,
  setLoading,
  loading,
  container,
  state,
  sheets,
  refresh,
  routerRefresh,
}: StepProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [originalOpen, setOriginalOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  if (!preview) return null;

  const draftSummary = (() => {
    const d = state.draft;
    const voids = d.bought_items.filter((i) => i.action === "VOID").length;
    const boughts = d.bought_items.filter((i) => i.action === "BOUGHT").length;
    return {
      voids,
      boughts,
      matches: d.matches.length,
      qty_splits: d.qty_splits.reduce((acc, s) => acc + s.splits.length, 0),
      merges: d.merged_inventories.length,
      tax_edits: d.tax_edits.length,
      split_selections: d.split_selections.length,
    };
  })();

  // Monitoring sheet's tab name (inside the workbook).
  const buildSheetName = () => {
    let name = `${container.supplier.name.toUpperCase()} ${container.barcode.toUpperCase()}`;
    if (name.length > 30) name = name.replace("CO.,LTD", "");
    return name;
  };
  // Downloaded `.xlsx` file name — sheet name plus a suffix so the user can tell
  // the original vs. configured/finalized downloads apart at a glance.
  const buildFilename = (variant: "modified" | "original") => {
    return `${buildSheetName()} - ${variant}`;
  };
  const buildWorkbookBlob = (
    previewForGen: NonNullable<typeof preview>,
    splitSelections: string[],
    variant: "modified" | "original",
    download: boolean,
  ) => {
    const reportData = buildReportData(previewForGen, splitSelections);
    const { monitoring: finalMonitoring, reassignedCount } =
      reassign5013ToRandomBidders(
        reportData.monitoring,
        previewForGen.available_bidders,
      );

    const blob = generateReport(
      {
        monitoring: finalMonitoring,
        inventories: reportData.inventories,
        sheetDetails: container,
        deductions: previewForGen.report.deductions,
      },
      sheets,
      buildFilename(variant),
      buildSheetName(),
      { download },
    );

    return { blob, reassignedCount };
  };

  // Generates the Excel workbook from the (draft-applied) preview, without
  // committing anything to the DB. Refreshes the preview first so any decisions
  // staged in earlier steps are reflected even if the user got here via step
  // pills instead of Continue handlers.
  const handleGenerateOnly = async () => {
    setPreviewOpen(false);
    setLoading("Generating workbook...");
    try {
      const fresh = await refresh();
      const previewForGen = fresh ?? preview;

      const { reassignedCount } = buildWorkbookBlob(
        previewForGen,
        state.splitSelections,
        "modified",
        true,
      );

      if (reassignedCount > 0) {
        toast.info(
          `Reassigned ${reassignedCount} bidder 5013 item(s) to random bidders on the same auction.`,
        );
      }
      toast.success("Preview workbook generated (draft not committed).");
    } finally {
      setLoading(null);
    }
  };

  // Generates the workbook from a fresh preview that BYPASSES the draft —
  // i.e. raw DB state, no staged matches/bought-items/tax edits/splits. Does
  // not update the wizard's state.preview, so the user's working draft view
  // is untouched.
  const handleGenerateOriginal = async () => {
    setOriginalOpen(false);
    setLoading("Generating original report...");
    try {
      const res = await getFinalReportPreview({
        barcode: container.barcode,
        selected_dates: state.options.selected_dates,
        exclude_bidder_740: state.options.exclude_bidder_740,
        exclude_refunded_bidder_5013: state.options.exclude_refunded_bidder_5013,
        deduct_thirty_k: state.options.deduct_thirty_k,
        ignore_draft: true,
      });
      if (!res.ok) {
        toast.error(res.error.message, {
          description:
            typeof res.error.cause === "string" ? res.error.cause : undefined,
        });
        return;
      }
      const rawPreview = res.value;

      // Original report ignores the wizard's split selections too.
      const { reassignedCount } = buildWorkbookBlob(
        rawPreview,
        [],
        "original",
        true,
      );

      if (reassignedCount > 0) {
        toast.info(
          `Reassigned ${reassignedCount} bidder 5013 item(s) to random bidders on the same auction.`,
        );
      }
      toast.success("Original report generated (draft not applied).");
    } finally {
      setLoading(null);
    }
  };

  const handleFinalizeAndGenerate = async () => {
    setFinalizeOpen(false);
    setLoading("Finalizing & generating workbook...");
    try {
      const originalRes = await getFinalReportPreview({
        barcode: container.barcode,
        selected_dates: state.options.selected_dates,
        exclude_bidder_740: state.options.exclude_bidder_740,
        exclude_refunded_bidder_5013: state.options.exclude_refunded_bidder_5013,
        deduct_thirty_k: state.options.deduct_thirty_k,
        ignore_draft: true,
      });
      if (!originalRes.ok) {
        toast.error(originalRes.error.message, {
          description:
            typeof originalRes.error.cause === "string"
              ? originalRes.error.cause
              : undefined,
        });
        return;
      }

      const originalWorkbook = buildWorkbookBlob(
        originalRes.value,
        [],
        "original",
        false,
      );

      const finRes = await finalizeFinalReport(container.container_id);
      if (!finRes.ok) {
        toast.error(finRes.error.message, {
          description:
            typeof finRes.error.cause === "string" ? finRes.error.cause : undefined,
        });
        return;
      }

      const logResult = await logContainerReport({
        container_id: container.container_id,
        barcode: container.barcode,
        supplier_name: container.supplier.name,
        selected_dates: state.options.selected_dates,
        exclude_bidder_740: state.options.exclude_bidder_740,
        exclude_refunded_bidder_5013: state.options.exclude_refunded_bidder_5013,
        deduct_thirty_k: state.options.deduct_thirty_k,
        sheets,
      });
      if (!logResult.ok) {
        toast.error(logResult.error.message, {
          description:
            typeof logResult.error.cause === "string"
              ? logResult.error.cause
              : undefined,
        });
        return;
      }

      const fresh = await refresh();
      const previewForGen = fresh ?? preview;

      const modifiedWorkbook = buildWorkbookBlob(
        previewForGen,
        state.splitSelections,
        "modified",
        true,
      );

      const formData = new FormData();
      formData.append(
        "original_file",
        new File([originalWorkbook.blob], `${buildFilename("original")}.xlsx`, {
          type: originalWorkbook.blob.type,
        }),
      );
      formData.append(
        "modified_file",
        new File([modifiedWorkbook.blob], `${buildFilename("modified")}.xlsx`, {
          type: modifiedWorkbook.blob.type,
        }),
      );
      const uploadRes = await uploadGeneratedFinalReportFiles(
        container.container_id,
        formData,
      );
      if (!uploadRes.ok) {
        toast.error(uploadRes.error.message, {
          description:
            typeof uploadRes.error.cause === "string"
              ? uploadRes.error.cause
              : undefined,
        });
        routerRefresh();
        return;
      }

      const reassignedCount =
        originalWorkbook.reassignedCount + modifiedWorkbook.reassignedCount;
      if (reassignedCount > 0) {
        toast.info(
          `Reassigned ${reassignedCount} bidder 5013 item(s) to random bidders on the same auction.`,
        );
      }
      toast.success("Workbook generated, uploaded, and draft committed.");
      routerRefresh();
    } finally {
      setLoading(null);
    }
  };

  const StagedChangesList = ({ withDbHint }: { withDbHint: boolean }) => (
    <ul className="list-disc pl-5 space-y-1">
      <li>
        <span className="font-medium">{draftSummary.voids}</span> void(s)
      </li>
      <li>
        <span className="font-medium">{draftSummary.boughts}</span> bought item(s)
      </li>
      <li>
        <span className="font-medium">{draftSummary.matches}</span> auto-resolved match(es)
      </li>
      <li>
        <span className="font-medium">{draftSummary.qty_splits}</span> qty split target(s)
      </li>
      <li>
        <span className="font-medium">{draftSummary.merges}</span> staged merge(s)
      </li>
      <li>
        <span className="font-medium">{draftSummary.split_selections}</span> split selection(s)
        {withDbHint ? (
          <span className="text-muted-foreground"> — workbook only, not written to DB</span>
        ) : null}
      </li>
      <li>
        <span className="font-medium">{draftSummary.tax_edits}</span> tax deduction edit(s)
        {withDbHint ? (
          <span className="text-muted-foreground"> — workbook only, not written to DB</span>
        ) : null}
      </li>
    </ul>
  );

  return (
    <StepShell
      step="generate"
      visibleSteps={visibleSteps}
      onBack={goBack}
      onJumpTo={goTo}
      jumpDisabled={jumpDisabled}
      loading={loading}
      description="Final review. All auction dates for this container are included. Generate Report builds a preview Excel workbook from your staged draft without committing anything. Finalize & Generate commits the draft to the database (matches, voids, bought items, etc.) and then builds the workbook. In both cases, monitoring rows with bidder 5013 are reassigned to a random non-5013 bidder from the same auction."
      rightSlot={
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" disabled={Boolean(loading)}>
                Generate Report <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setPreviewOpen(true)}>
                With configured settings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setOriginalOpen(true)}>
                Original
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            onClick={() => setFinalizeOpen(true)}
            disabled={Boolean(loading)}
          >
            Finalize & Generate
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground">Included auction dates</p>
          <p className="font-medium">{state.options.selected_dates.join(", ")}</p>
        </div>
      </div>

      <div className="mt-4 border rounded p-3">
        <p className="text-sm font-medium mb-2">Draft staged changes</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Voids: </span>
            <span className="font-medium">{draftSummary.voids}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Bought items: </span>
            <span className="font-medium">{draftSummary.boughts}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Matches: </span>
            <span className="font-medium">{draftSummary.matches}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Qty splits: </span>
            <span className="font-medium">{draftSummary.qty_splits}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Merges: </span>
            <span className="font-medium">{draftSummary.merges}</span>
          </div>
        </div>
      </div>

      {/* Generate Report (preview) prompt */}
      <AlertDialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Preview Final Report</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  This generates a <span className="font-medium">PREVIEW</span> of the
                  final report using your staged configuration.{" "}
                  <span className="font-medium">Nothing will be written to the database.</span>
                </p>
                <p>The workbook will include the following staged changes:</p>
                <StagedChangesList withDbHint={false} />
                <p className="text-muted-foreground">
                  Note: bidder 5013 items will be reassigned to a random non-5013
                  bidder from the same auction in the generated workbook.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateOnly}>
              Download Preview
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate Original Report prompt */}
      <AlertDialog open={originalOpen} onOpenChange={setOriginalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Original Report</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  This generates the{" "}
                  <span className="font-medium">original</span> version of the
                  report — none of your staged wizard changes are applied (no
                  bought items, matches, qty splits, split selections, or tax
                  edits). Use this to compare against the configured version.
                </p>
                <p className="text-muted-foreground">
                  Note: bidder 5013 items are still reassigned to a random
                  non-5013 bidder from the same auction in the generated workbook.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateOriginal}>
              Download Original
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finalize & Generate prompt */}
      <AlertDialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize draft and commit to database?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  The following staged changes will be written to the database
                  and cannot be easily undone:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {draftSummary.voids > 0 && (
                    <li>
                      <span className="font-medium">{draftSummary.voids}</span>{" "}
                      void(s) — the corresponding inventory items will be flagged
                      and removed from the report
                    </li>
                  )}
                  {draftSummary.boughts > 0 && (
                    <li>
                      <span className="font-medium">{draftSummary.boughts}</span>{" "}
                      bought item(s) — new auction-inventory records will be
                      created against the ATC bidder of the selected auction
                    </li>
                  )}
                  {draftSummary.matches > 0 && (
                    <li>
                      <span className="font-medium">{draftSummary.matches}</span>{" "}
                      auto-resolved match(es) — UNSOLD 3-part inventories will be
                      merged into their matching 2-part auction rows; the 2-part
                      inventories will be soft-deleted
                    </li>
                  )}
                  {draftSummary.merges > 0 && (
                    <li>
                      <span className="font-medium">{draftSummary.merges}</span>{" "}
                      manual merge(s) — selected UNSOLD inventories will inherit
                      their selected two-part auction records; the two-part
                      inventories will be soft-deleted
                    </li>
                  )}
                  {draftSummary.qty_splits > 0 && (
                    <li>
                      <span className="font-medium">{draftSummary.qty_splits}</span>{" "}
                      qty split(s) — source auction rows will have their qty/price
                      reduced; new auction-inventory rows will be created for
                      each split target
                    </li>
                  )}
                  {draftSummary.voids === 0 &&
                    draftSummary.boughts === 0 &&
                    draftSummary.matches === 0 &&
                    draftSummary.merges === 0 &&
                    draftSummary.qty_splits === 0 && (
                      <li className="text-muted-foreground italic">
                        No DB-mutating decisions in the draft.
                      </li>
                    )}
                </ul>
                <p className="text-muted-foreground">
                  The following are <span className="font-medium">excluded</span>{" "}
                  from the DB write — they only affect the generated Excel
                  workbook:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    Split selections ({draftSummary.split_selections}) — applied
                    to the workbook's monitoring rows only
                  </li>
                  <li>
                    Tax deduction edits ({draftSummary.tax_edits}) — applied to
                    the workbook's deductions sheet only
                  </li>
                  <li>
                    Bidder 5013 reassignment — items get a random non-5013
                    bidder from the same auction in the workbook only
                  </li>
                </ul>
                <p>
                  If any staged change conflicts with the current database state
                  (e.g., an item was modified elsewhere), the finalize aborts
                  with an error and your draft stays intact.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizeAndGenerate}>
              Finalize & Generate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StepShell>
  );
};
