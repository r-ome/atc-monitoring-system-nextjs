"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Download, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { generateReport } from "@/app/lib/reports";
import {
  getFinalReportPreview,
  logFinalReportGeneration,
} from "@/app/(protected)/containers/actions";
import { buildReportData } from "../../components/inventories/FinalReportWorkbench/shared/buildReportData";
import { cn } from "@/app/lib/utils";
import { StepHeading } from "../shared/StepHeading";
import { peso } from "../shared/format";
import { reassign5013ToRandomBidders } from "../shared/reassign5013";
import { buildFinalReportGenerationLogInput } from "../shared/activity-log";
import type { V2StepProps } from "../shared/types";
import type { FinalReportPreview } from "src/entities/models/FinalReport";

type SheetKey = "items" | "final" | "encode" | "unsold" | "bill";

const SHEET_META: Record<
  SheetKey,
  { label: string; accent: string }
> = {
  items: { label: "Items", accent: "#22863a" },
  final: { label: "FINAL COMPUTATION", accent: "#1f77b4" },
  encode: { label: "ENCODE", accent: "#5f3dc4" },
  unsold: { label: "UNSOLD", accent: "#d97706" },
  bill: { label: "BILL", accent: "#6f42c1" },
};

export const PreviewStep = (props: V2StepProps) => {
  if (!props.preview) {
    return <div className="p-7 text-sm text-muted-foreground">Loading…</div>;
  }
  return <PreviewStepBody {...props} preview={props.preview} />;
};

type PreviewBodyProps = V2StepProps & {
  preview: NonNullable<V2StepProps["preview"]>;
};

const PreviewStepBody = ({
  preview,
  state,
  container,
  sheets,
  refresh,
  saveDraft,
}: PreviewBodyProps) => {
  const [activeSheet, setActiveSheet] = useState<SheetKey>("items");
  const [downloading, setDownloading] = useState(false);

  const buildSheetName = () => {
    let name = `${container.supplier.name.toUpperCase()} ${container.barcode.toUpperCase()}`;
    if (name.length > 30) name = name.replace("CO.,LTD", "");
    return name;
  };

  const buildFilename = (variant: "modified" | "original") =>
    `${buildSheetName()} - ${variant}`;

  const previewFilename = `${buildFilename("modified")}_PREVIEW.xlsx`;

  const handleDownload = async (variant: "modified" | "original") => {
    setDownloading(true);
    try {
      let previewForGen: FinalReportPreview = preview;
      if (variant === "modified") {
        try {
          await saveDraft(state.draft);
        } catch {
          // saveDraft already toasted. Don't generate a workbook from a
          // server-side draft that didn't accept our latest changes.
          return;
        }
        const fresh = await refresh();
        if (!fresh) {
          // The previous preview may not reflect the just-saved draft, so
          // a workbook built from it could omit the latest edits. Match
          // the finalize behavior and abort instead of downloading stale.
          toast.error(
            "Couldn't refresh the preview after saving. Try again to download.",
          );
          return;
        }
        previewForGen = fresh;
      } else {
        const res = await getFinalReportPreview({
          barcode: container.barcode,
          selected_dates: state.options.selected_dates,
          exclude_bidder_740: state.options.exclude_bidder_740,
          exclude_refunded_bidder_5013: state.options.exclude_refunded_bidder_5013,
          deduct_thirty_k: state.options.deduct_thirty_k,
          ignore_draft: true,
        });
        if (!res.ok) {
          toast.error(res.error.message);
          return;
        }
        previewForGen = res.value;
      }

      const reportData = buildReportData(previewForGen, []);
      const { monitoring: finalMonitoring, reassignedCount } =
        variant === "modified"
          ? reassign5013ToRandomBidders(
              reportData.monitoring,
              previewForGen.available_bidders,
            )
          : { monitoring: reportData.monitoring, reassignedCount: 0 };

      generateReport(
        {
          monitoring: finalMonitoring,
          inventories: reportData.inventories,
          sheetDetails: container,
          deductions: previewForGen.report.deductions,
        },
        sheets,
        buildFilename(variant),
        buildSheetName(),
        { download: true },
      );

      const logRes = await logFinalReportGeneration(
        buildFinalReportGenerationLogInput({
          action:
            variant === "modified" ? "preview_modified" : "preview_original",
          workbookVariant: variant,
          container,
          options: state.options,
          sheets,
          preview: previewForGen,
          draft: state.draft,
          reassignedBidder5013Count: reassignedCount,
        }),
      );
      if (!logRes.ok) {
        toast.error(`Activity log failed: ${logRes.error.message}`);
      }

      if (reassignedCount > 0) {
        toast.info(
          `Reassigned ${reassignedCount} bidder 5013 item(s) to random bidders in the modified workbook.`,
        );
      }
      toast.success(
        variant === "modified"
          ? "Preview workbook downloaded."
          : "Original workbook downloaded.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] p-7">
      <div className="mb-4 flex items-end justify-between gap-4">
        <StepHeading
          n={5}
          title="Preview the final report"
          sub="This is a simulation of what the supplier will receive. In the modified workbook, bidder 5013 rows are changed to random non-5013 bidder numbers. Download the preview file to inspect it in Excel before finalizing."
        />
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={downloading}>
                Compare with original <ChevronDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => void handleDownload("original")}
              >
                Download original .xlsx
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="h-9 font-semibold"
            disabled={downloading}
            onClick={() => void handleDownload("modified")}
          >
            <Download size={14} /> Download preview .xlsx
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0 shadow-sm">
        {/* Title bar */}
        <div className="flex items-center justify-between gap-2.5 border-b bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded bg-emerald-600 text-[11px] font-bold text-white">
              X
            </span>
            <span className="font-mono text-[12.5px] font-semibold">
              {previewFilename}
            </span>
            <span className="text-[12px] text-muted-foreground">
              · 5 sheets · preview only
            </span>
          </div>
          <span className="text-[12px] text-muted-foreground">
            Read-only simulation
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-muted/40 px-2 pt-1">
          {(Object.keys(SHEET_META) as SheetKey[]).map((key) => {
            const meta = SHEET_META[key];
            const active = activeSheet === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSheet(key)}
                className={cn(
                  "border-b-2 px-3 py-1.5 text-[12.5px] transition",
                  active
                    ? "border-current bg-background font-bold"
                    : "border-transparent text-muted-foreground hover:bg-background/50",
                )}
                style={active ? { color: meta.accent, borderColor: meta.accent } : undefined}
              >
                {key === "items"
                  ? `${container.barcode} · ${container.supplier.name}`
                  : meta.label}
              </button>
            );
          })}
        </div>

        {/* Sheet body */}
        <div className="bg-background p-5">
          {activeSheet === "items" && <ItemsSheet preview={preview} container={container} />}
          {activeSheet === "final" && <FinalSheet preview={preview} container={container} />}
          {activeSheet === "encode" && <EncodeSheet preview={preview} />}
          {activeSheet === "unsold" && <UnsoldSheet preview={preview} container={container} />}
          {activeSheet === "bill" && <BillSheet preview={preview} container={container} />}
        </div>
      </Card>

      <div className="mt-4 flex items-start gap-2.5 rounded-[10px] bg-primary/10 px-4 py-3.5 text-[12.5px] text-foreground/90">
        <Sparkles size={16} className="mt-[2px] shrink-0 text-primary" />
        <span>
          The downloaded file matches this preview. Once you finalize in the
          next step, the same file is sent to{" "}
          <span className="font-semibold">{container.supplier.name}</span> and
          saved with the container&apos;s reports.
        </span>
      </div>
    </div>
  );
};

// ─── Sheet bodies ────────────────────────────────────────────────────────

const ItemsSheet = ({
  preview,
  container,
}: {
  preview: FinalReportPreview;
  container: V2StepProps["container"];
}) => {
  const monitoring = preview.report.monitoring;
  const totalPrice = monitoring.reduce((s, m) => s + m.price, 0);
  const highest = monitoring.reduce(
    (acc, m) => (m.price > acc ? m.price : acc),
    0,
  );
  const sample = monitoring.slice(0, 14);
  return (
    <div>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        SHEET
      </div>
      <h2 className="mb-0.5 text-[20px] font-semibold tracking-[-0.01em]">
        {container.supplier.name} · {container.barcode}
      </h2>
      <p className="mb-4 text-[12.5px] text-muted-foreground">
        Sold items detail · {container.branch_name ?? "—"} branch
      </p>
      <div className="mb-4 grid grid-cols-4 gap-px border-2 border-foreground bg-foreground text-[12.5px]">
        <div className="bg-background px-3 py-2 font-semibold">
          TOTAL PRICE OF ITEMS
        </div>
        <div className="bg-background px-3 py-2 text-right font-mono">
          {peso(totalPrice)}
        </div>
        <div
          className="px-3 py-2 font-semibold"
          style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
        >
          HIGHEST PRICE (Monitoring)
        </div>
        <div
          className="px-3 py-2 text-right font-mono"
          style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
        >
          {peso(highest)}
        </div>
        <div className="bg-background px-3 py-2 font-semibold">
          NUMBER OF ITEMS
        </div>
        <div className="bg-background px-3 py-2 text-right font-mono">
          {monitoring.length}
        </div>
        <div className="bg-background px-3 py-2" />
        <div className="bg-background px-3 py-2" />
      </div>
      <div className="overflow-hidden rounded border">
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "#cfe2f3" }}>
              <TableHead style={{ color: "#0c2c4a" }}>Barcode</TableHead>
              <TableHead style={{ color: "#0c2c4a" }}>Control</TableHead>
              <TableHead style={{ color: "#0c2c4a" }}>Description</TableHead>
              <TableHead style={{ color: "#0c2c4a" }}>Bidder #</TableHead>
              <TableHead className="text-center" style={{ color: "#0c2c4a" }}>
                Qty
              </TableHead>
              <TableHead className="text-right" style={{ color: "#0c2c4a" }}>
                Price
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sample.map((row) => (
              <TableRow key={row.auction_inventory_id}>
                <TableCell className="font-mono text-[12.5px]">{row.barcode}</TableCell>
                <TableCell className="font-mono text-[12.5px] text-muted-foreground">
                  {row.control}
                </TableCell>
                <TableCell className="text-[13px]">{row.description}</TableCell>
                <TableCell className="font-mono text-[12.5px]">
                  {row.bidder_number}
                </TableCell>
                <TableCell className="text-center font-mono text-[12.5px]">
                  {row.qty}
                </TableCell>
                <TableCell className="text-right font-mono text-[12.5px]">
                  {row.price.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2.5 text-center text-[11.5px] italic text-muted-foreground">
        … showing {sample.length} of {monitoring.length} rows · the .xlsx file
        includes all
      </p>
    </div>
  );
};

const FinalSheet = ({
  preview,
  container,
}: {
  preview: FinalReportPreview;
  container: V2StepProps["container"];
}) => {
  const total = preview.report.monitoring.reduce(
    (s, m) => s + m.price,
    0,
  );
  return (
    <div>
      <h2 className="mb-0.5 text-[20px] font-semibold tracking-[-0.01em]">
        Final Computation
      </h2>
      <p className="mb-4 text-[12.5px] text-muted-foreground">
        支払明細 · payment breakdown for the supplier
      </p>
      <div className="mb-3 border-b-2 border-foreground pb-1.5 text-center text-[13px] font-bold uppercase tracking-wide">
        {container.supplier.name}
      </div>
      <div className="mb-4 flex items-center justify-between text-[12.5px]">
        <div>
          <span className="font-mono font-semibold">{container.barcode}</span>{" "}
          <span className="text-muted-foreground">
            本目コンテナ · Container reference
          </span>
        </div>
        <div className="text-muted-foreground">単位ペソ · Unit: PHP</div>
      </div>
      <Card className="mb-4 p-4 text-[12.5px]">
        <div className="mb-2 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Item sales / 売上
            </div>
            <div className="mt-0.5 font-mono text-[16px] font-bold">
              {peso(total)}
            </div>
          </div>
          <div>
            <div
              className="text-[10.5px] font-semibold uppercase tracking-wide"
              style={{ color: "#9b1c1c" }}
            >
              Sales commission 15% / 販売手数料15%
            </div>
            <div
              className="mt-0.5 font-mono text-[16px] font-bold"
              style={{ color: "#9b1c1c" }}
            >
              −{peso(Math.round(total * 0.15))}
            </div>
          </div>
        </div>
        <p className="text-[11.5px] text-muted-foreground">
          The full bilingual final computation table renders in the downloaded
          .xlsx (sender, supplier, bank receiver, JPY rate, totals, terminology
          legend). This is a simplified preview of the key amounts.
        </p>
      </Card>
    </div>
  );
};

const EncodeSheet = ({ preview }: { preview: FinalReportPreview }) => {
  const inventories = preview.report.inventories.slice(0, 14);
  return (
    <div>
      <h2 className="mb-0.5 text-[20px] font-semibold tracking-[-0.01em]">
        Encode
      </h2>
      <p className="mb-4 text-[12.5px] text-muted-foreground">
        Item-by-item sold status used by encoders.
      </p>
      <div className="overflow-hidden rounded border">
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "#cfe2f3" }}>
              <TableHead style={{ color: "#0c2c4a" }}>Barcode</TableHead>
              <TableHead style={{ color: "#0c2c4a" }}>CTRL#</TableHead>
              <TableHead style={{ color: "#0c2c4a" }}>Description</TableHead>
              <TableHead className="text-center" style={{ color: "#0c2c4a" }}>
                SOLD / UNSOLD
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventories.map((row) => {
              const status =
                row.auctions_inventory?.status === "REFUNDED" ||
                row.status === "UNSOLD"
                  ? "UNSOLD"
                  : "SOLD";
              return (
                <TableRow key={row.inventory_id}>
                  <TableCell className="font-mono text-[12.5px]">
                    {row.barcode}
                  </TableCell>
                  <TableCell className="font-mono text-[12.5px] text-muted-foreground">
                    {row.control}
                  </TableCell>
                  <TableCell className="text-[13px]">{row.description}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "font-semibold",
                        status === "SOLD"
                          ? "text-[#0c2c4a]"
                          : "text-[#c0392b]",
                      )}
                    >
                      {status}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2.5 text-center text-[11.5px] italic text-muted-foreground">
        … showing {inventories.length} of {preview.report.inventories.length}{" "}
        rows
      </p>
    </div>
  );
};

const UnsoldSheet = ({
  preview,
  container,
}: {
  preview: FinalReportPreview;
  container: V2StepProps["container"];
}) => {
  const unsoldCount = preview.unsold_items.length;
  const soldCount = preview.report.monitoring.length;
  const totalSales = preview.report.monitoring.reduce(
    (s, m) => s + m.price,
    0,
  );
  return (
    <div>
      <h2 className="mb-0.5 text-[20px] font-semibold tracking-[-0.01em]">
        Unsold
      </h2>
      <p className="mb-4 text-[12.5px] text-muted-foreground">
        Stat-box overview at the time of finalization.
      </p>
      <div className="mb-3 border-b-2 border-foreground pb-1.5 text-center text-[22px] font-bold uppercase">
        {container.supplier.name}
      </div>
      <div className="mb-4 text-center font-mono text-[14px] font-semibold">
        {container.barcode}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="UNSOLD ITEMS" value={String(unsoldCount)} headerBg="#dc2626" headerFg="#fff" />
        <StatBox
          label="SOLD ITEMS"
          value={String(soldCount)}
          headerBg="#fde047"
          headerFg="#1f2937"
        />
        <StatBox label="TOTAL SALE" value={peso(totalSales)} headerBg="#3b82f6" headerFg="#fff" />
      </div>
    </div>
  );
};

const StatBox = ({
  label,
  value,
  headerBg,
  headerFg,
}: {
  label: string;
  value: string;
  headerBg: string;
  headerFg: string;
}) => (
  <div className="overflow-hidden rounded border">
    <div
      className="px-3.5 py-2 text-center text-[12px] font-bold uppercase tracking-[0.06em]"
      style={{ backgroundColor: headerBg, color: headerFg }}
    >
      {label}
    </div>
    <div className="px-4 py-5 text-center font-mono text-[22px] font-bold tracking-[-0.02em]">
      {value}
    </div>
  </div>
);

const BillSheet = ({
  preview,
  container,
}: {
  preview: FinalReportPreview;
  container: V2StepProps["container"];
}) => {
  const total = preview.report.monitoring.reduce(
    (s, m) => s + m.price,
    0,
  );
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div>
      <div
        className="mb-4 border px-4 py-5 text-center text-[26px] font-bold uppercase tracking-[0.04em]"
        style={{ backgroundColor: "#e6e0f8" }}
      >
        BILL
      </div>
      <div className="mb-3 flex items-center justify-between text-[12.5px]">
        <span className="font-semibold">
          ATC JAPAN AUCTION PRODUCT TRADING
        </span>
        <span className="text-muted-foreground">Date: {today}</span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-4">
        <Card className="p-3.5 text-[12.5px]">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            TOTAL
          </div>
          <div className="mt-1 font-mono text-[18px] font-bold">
            PHP {total.toLocaleString()}.00
          </div>
        </Card>
        <Card className="p-3.5 text-[12.5px]">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            SUPPLIER
          </div>
          <div className="mt-1 font-semibold">{container.supplier.name}</div>
        </Card>
      </div>
      <p className="text-[11.5px] text-muted-foreground">
        Full bank details, BL number, description and signature blocks render
        in the downloaded .xlsx.
      </p>
    </div>
  );
};
