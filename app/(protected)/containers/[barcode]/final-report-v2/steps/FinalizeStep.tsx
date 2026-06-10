"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Download,
  Package,
  Receipt,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { generateReport } from "@/app/lib/reports";
import {
  finalizeFinalReport,
  getFinalReportPreview,
  logFinalReportGeneration,
  uploadGeneratedFinalReportFiles,
} from "@/app/(protected)/containers/actions";
import { buildReportData } from "../../components/inventories/FinalReportWorkbench/shared/buildReportData";
import { cn } from "@/app/lib/utils";
import { StepHeading } from "../shared/StepHeading";
import { peso } from "../shared/format";
import { reassign5013ToRandomBidders } from "../shared/reassign5013";
import { buildFinalReportGenerationLogInput } from "../shared/activity-log";
import { findResolution } from "../shared/resolution";
import type { V2StepProps } from "../shared/types";

type SuccessState = {
  reportFilename: string;
  netToSupplier: number;
  taxWithheld: number;
  finalizedAt: Date;
  // Set when the DB finalize succeeded but a follow-up post-finalize step
  // (log or file upload) failed. The container is committed; only the
  // post-finalize artifact write needs attention.
  partialFailure: string | null;
} | null;

export const FinalizeStep = (props: V2StepProps) => {
  if (!props.preview) {
    return <div className="p-7 text-sm text-muted-foreground">Loading…</div>;
  }
  return <FinalizeStepBody {...props} preview={props.preview} />;
};

type FinalizeBodyProps = V2StepProps & {
  preview: NonNullable<V2StepProps["preview"]>;
};

const FinalizeStepBody = ({
  preview,
  state,
  setState,
  saveDraft,
  refresh,
  container,
  sheets,
}: FinalizeBodyProps) => {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const draftSummary = (() => {
    const d = state.draft;
    return {
      voids: d.bought_items.filter((i) => i.action === "VOID").length,
      boughts: d.bought_items.filter((i) => i.action === "BOUGHT").length,
      merges: d.merged_inventories.length,
      qty_splits: d.qty_splits.reduce((acc, s) => acc + s.splits.length, 0),
      appended: d.appended_inventory_ids.length,
      tax_edits: d.tax_edits.length,
    };
  })();

  const unresolvedItems = preview.unsold_items.filter(
    (item) => !findResolution(state.draft, item.inventory_id),
  );
  const unresolved = unresolvedItems.length;
  // Safety net: even if the user reached this step via a rail jump that
  // skipped AppendStep, we should not finalize without every appendable
  // two-part SOLD row having been staged. V2Wizard auto-stages centrally,
  // but if its effect hasn't run yet (e.g. preview just arrived), the
  // button stays disabled until the staged count catches up.
  const appendableIds = new Set(
    preview.appendable_unsold_items.map((i) => i.inventory_id),
  );
  const stagedAppendCount = state.draft.appended_inventory_ids.filter((id) =>
    appendableIds.has(id),
  ).length;
  const appendBlocked =
    preview.appendable_unsold_items.length > 0 &&
    stagedAppendCount < preview.appendable_unsold_items.length;

  const taxWithheld = state.draft.tax_edits.reduce(
    (sum, e) => sum + e.deducted_amount,
    0,
  );
  const netToSupplier = preview.report.monitoring.reduce(
    (s, m) => s + m.price,
    0,
  );

  const buildSheetName = () => {
    let name = `${container.supplier.name.toUpperCase()} ${container.barcode.toUpperCase()}`;
    if (name.length > 30) name = name.replace("CO.,LTD", "");
    return name;
  };
  const buildFilename = (variant: "modified" | "original") =>
    `${buildSheetName()} - ${variant}`;

  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleFinalize = async () => {
    if (!confirmed || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      // 1. Build original workbook from ignore_draft preview
      const originalRes = await getFinalReportPreview({
        barcode: container.barcode,
        selected_dates: state.options.selected_dates,
        exclude_bidder_740: state.options.exclude_bidder_740,
        exclude_refunded_bidder_5013:
          state.options.exclude_refunded_bidder_5013,
        deduct_thirty_k: state.options.deduct_thirty_k,
        ignore_draft: true,
      });
      if (!originalRes.ok) {
        setErrorMessage(originalRes.error.message);
        return;
      }
      const originalReportData = buildReportData(originalRes.value, []);
      const originalBlob = generateReport(
        {
          monitoring: originalReportData.monitoring,
          inventories: originalReportData.inventories,
          sheetDetails: container,
          deductions: originalRes.value.report.deductions,
        },
        sheets,
        buildFilename("original"),
        buildSheetName(),
        { download: false },
      );

      // 2. Save draft, refresh, build modified workbook. If refresh fails we
      // MUST abort: the previous preview may not reflect the just-saved
      // draft, and continuing would upload a workbook missing those
      // decisions / tax edits while the DB finalize still commits them.
      await saveDraft(state.draft);
      const fresh = await refresh();
      if (!fresh) {
        setErrorMessage(
          "Couldn't refresh the preview after saving the draft. Finalize aborted — please try again.",
        );
        return;
      }
      const modifiedPreview = fresh;
      const modifiedReportData = buildReportData(modifiedPreview, []);
      const { monitoring: modMonitoring, reassignedCount } =
        reassign5013ToRandomBidders(
          modifiedReportData.monitoring,
          modifiedPreview.available_bidders,
        );
      const modifiedBlob = generateReport(
        {
          monitoring: modMonitoring,
          inventories: modifiedReportData.inventories,
          sheetDetails: container,
          deductions: modifiedPreview.report.deductions,
        },
        sheets,
        buildFilename("modified"),
        buildSheetName(),
        { download: false },
      );

      // 3. Finalize on server (commits DB). PAST THIS LINE the container is
      // committed regardless of what happens with logging / uploading below.
      const finRes = await finalizeFinalReport(container.container_id);
      if (!finRes.ok) {
        // Pre-finalize failure — DB is still clean.
        setErrorMessage(finRes.error.message);
        return;
      }
      const finalizedAt = new Date();
      const partialFailures: string[] = [];

      // 4. Log + upload. Errors here are post-finalize — surface them but
      // still show the success view so the user knows the container is locked.
      const logRes = await logFinalReportGeneration(
        buildFinalReportGenerationLogInput({
          action: "finalize",
          workbookVariant: "modified",
          container,
          options: state.options,
          sheets,
          preview: modifiedPreview,
          draft: state.draft,
          reassignedBidder5013Count: reassignedCount,
        }),
      );
      if (!logRes.ok) {
        partialFailures.push(`Activity log: ${logRes.error.message}`);
      }

      const formData = new FormData();
      formData.append(
        "original_file",
        new File([originalBlob as Blob], `${buildFilename("original")}.xlsx`, {
          type: (originalBlob as Blob).type,
        }),
      );
      formData.append(
        "modified_file",
        new File([modifiedBlob as Blob], `${buildFilename("modified")}.xlsx`, {
          type: (modifiedBlob as Blob).type,
        }),
      );
      const uploadRes = await uploadGeneratedFinalReportFiles(
        container.container_id,
        formData,
      );
      if (!uploadRes.ok) {
        partialFailures.push(`Report upload: ${uploadRes.error.message}`);
      }

      if (reassignedCount > 0) {
        toast.info(
          `Reassigned ${reassignedCount} bidder 5013 item(s) to random bidders.`,
        );
      }
      // Always download the modified workbook locally — if the upload failed,
      // the user at least has the file they can hand off / re-upload manually.
      downloadBlob(modifiedBlob as Blob, buildFilename("modified"));

      setSuccess({
        reportFilename: `${buildFilename("modified")}.xlsx`,
        netToSupplier,
        taxWithheld,
        finalizedAt,
        partialFailure:
          partialFailures.length > 0 ? partialFailures.join(" · ") : null,
      });
      // Signal the wizard shell to lock down navigation. finalizeFinalReport
      // has cleared the server draft, so navigating back to Preview/Resolve
      // would surface stale in-memory state that no longer matches the DB.
      setState((prev) => ({ ...prev, finalized: true }));
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Unknown error during finalize.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const hadPartialFailure = success.partialFailure !== null;
    return (
      <div className="mx-auto w-full max-w-[620px] p-7 pt-8 text-center">
        <div
          className={cn(
            "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
            hadPartialFailure
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
          )}
        >
          <Check size={32} />
        </div>
        <h1 className="mb-2 text-[26px] font-semibold tracking-[-0.015em]">
          Container {container.barcode} is finalized
        </h1>
        <p className="mx-auto mb-5 max-w-[460px] text-[14.5px] leading-relaxed text-muted-foreground">
          {hadPartialFailure
            ? "The container is locked in, but one or more post-finalize steps failed. The downloaded file is your reference copy — see the details below."
            : `Final report sent to ${container.supplier.name}. Tax record saved. Unsold items are queued for the next auction.`}
        </p>
        {hadPartialFailure ? (
          <div className="mb-5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-left text-[13px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="mb-1 font-semibold">
              Some post-finalize steps failed
            </div>
            <div className="text-[12.5px]">{success.partialFailure}</div>
            <div className="mt-2 text-[12px] text-amber-800/80 dark:text-amber-300/80">
              The container itself is finalized and can&apos;t be retried from
              this wizard. Ask an admin to re-upload the report files for this
              container if needed.
            </div>
          </div>
        ) : null}
        <Card className="mb-5 p-[18px] text-left">
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Receipt
          </div>
          <ReceiptRow
            label="Report file"
            value={
              hadPartialFailure
                ? `${success.reportFilename} · downloaded locally`
                : `${success.reportFilename} · sent to supplier`
            }
          />
          <ReceiptRow
            label="Net to supplier"
            value={peso(success.netToSupplier)}
          />
          <ReceiptRow
            label="Tax withheld"
            value={`${peso(success.taxWithheld)} · saved`}
          />
          <ReceiptRow
            label="Finalized at"
            value={success.finalizedAt.toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
        </Card>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/containers/${container.barcode}`)
            }
          >
            Back to container
          </Button>
          <Button onClick={() => router.push("/containers")}>
            All containers <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    );
  }

  const blocked = unresolved > 0 || appendBlocked;

  return (
    <div className="mx-auto w-full max-w-[920px] p-7">
      <StepHeading
        n={6}
        title="Ready to finalize"
        sub="One last check. When you finalize, the actions below run together and can't be undone — but everything you reviewed is saved exactly as you saw it."
      />

      <Card className="mb-4 p-[18px]">
        <div className="mb-1 text-[13.5px] font-semibold">
          What happens when you click &quot;Finalize&quot;
        </div>
        <p className="mb-3.5 text-[12.5px] text-muted-foreground">
          We&apos;ll lock in your draft first, then save the report files and
          log. Once the container is locked in, it can&apos;t be undone — if
          the file upload fails after locking in, the container stays
          finalized and an admin can re-upload manually.
        </p>
        <div className="flex flex-col gap-2">
          <ActionListItem
            Icon={ChevronRight}
            title="Lock in the items you reviewed"
            sub={`${preview.report.monitoring.length} sold, ${unresolved} still need attention, ${draftSummary.boughts} bought.`}
          />
          <ActionListItem
            Icon={Receipt}
            title={`Save ${peso(taxWithheld)} as tax withheld`}
            sub={`Goes to the tax records under Container ${container.barcode}.`}
          />
          <ActionListItem
            Icon={Package}
            title={`Append ${draftSummary.appended} item${draftSummary.appended === 1 ? "" : "s"} to this container`}
            sub="They'll show up with new three-part barcodes once finalized."
          />
          <ActionListItem
            Icon={Download}
            title="Generate &amp; upload the final spreadsheet"
            sub={`Saved with the container's reports. ${container.supplier.name} gets a copy.`}
          />
          <ActionListItem
            Icon={BarChart3}
            title="Log a full change history"
            sub="Every edit you made in Resolve is kept so we can answer questions later."
          />
        </div>
      </Card>

      {errorMessage ? (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => !blocked && setConfirmed((c) => !c)}
        disabled={blocked}
        className={cn(
          "flex w-full items-start gap-3 rounded-[10px] border px-4 py-3.5 text-left transition",
          confirmed
            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
            : "border-destructive/40 bg-destructive/5",
          blocked && "opacity-60",
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-[1.5px]",
            confirmed
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-destructive",
          )}
        >
          {confirmed ? <Check size={12} /> : null}
        </span>
        <div className="flex-1">
          <div
            className={cn(
              "text-[13.5px] font-semibold",
              confirmed ? "text-emerald-700 dark:text-emerald-300" : "text-destructive",
            )}
          >
            I&apos;ve reviewed everything and I&apos;m ready to finalize.
          </div>
          <div className="mt-px text-[12px] text-muted-foreground">
            Finalizing is permanent. To make changes after, you&apos;d have to
            ask an admin to reopen the container.
          </div>
        </div>
      </button>

      <div className="mt-5 flex justify-end">
        <Button
          size="lg"
          disabled={!confirmed || blocked || submitting}
          onClick={() => void handleFinalize()}
          className="h-10 font-semibold"
        >
          {submitting ? "Finalizing…" : "Finalize report"}
          <ArrowRight size={14} />
        </Button>
      </div>
      {blocked ? (
        <p className="mt-2 text-right text-[12px] text-destructive">
          {unresolved > 0
            ? `${unresolved} item${unresolved === 1 ? "" : "s"} still need a decision in step 2.`
            : `${preview.appendable_unsold_items.length - stagedAppendCount} two-part SOLD row(s) haven't been staged for append in step 4.`}
        </p>
      ) : null}
    </div>
  );
};

const ActionListItem = ({
  Icon,
  title,
  sub,
}: {
  Icon: typeof ChevronRight;
  title: string;
  sub: string;
}) => (
  <div className="flex items-center gap-3.5 rounded-md bg-muted/40 px-3.5 py-3">
    <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-background text-primary">
      <Icon size={14} />
    </span>
    <div>
      <div className="text-[13px] font-semibold">{title}</div>
      <div className="mt-px text-[12px] text-muted-foreground">{sub}</div>
    </div>
  </div>
);

const ReceiptRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-3 border-t py-2 first:border-t-0 first:pt-0">
    <span className="text-[12.5px] text-muted-foreground">{label}</span>
    <span className="text-right text-[13px] font-medium">{value}</span>
  </div>
);
