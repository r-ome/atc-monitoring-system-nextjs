"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, UploadIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import {
  previewRegularUpload,
  revalidateRegularUpload,
  confirmRegularUpload,
} from "../../actions";
import type { RegularUploadResult, RegularUploadRowInput } from "src/application/payroll/upload-regular-pipeline";
import type { BulkUpsertUploadRow } from "src/application/repositories/payroll-entries.repository.interface";
import type { WorkedDate } from "src/entities/models/PayrollEntry";
import { RegularPreviewTable } from "./RegularPreviewTable";

type Step = "upload" | "preview";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  payrollPeriodId: string;
  onApplied?: () => Promise<void>;
}

export const UploadRegularSheetModal: React.FC<Props> = ({
  open,
  onOpenChange,
  payrollPeriodId,
  onApplied,
}) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RegularUploadResult[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [auctionDates, setAuctionDates] = useState<string[]>([]);

  const reset = () => {
    setStep("upload");
    setRows([]);
    setPeriodStart("");
    setPeriodEnd("");
    setAuctionDates([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("payroll_period_id", payrollPeriodId);
      const res = await previewRegularUpload(fd);
      if (!res.ok) {
        toast.error(res.error?.message ?? "Failed to parse sheet");
        return;
      }
      setRows(res.value.rows);
      setPeriodStart(res.value.period_start);
      setPeriodEnd(res.value.period_end);
      setAuctionDates(res.value.auction_dates);
      setStep("preview");
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = async (rowIndex: number, workedDates: WorkedDate[]) => {
    setRows((prev) =>
      prev.map((r) =>
        r.rowIndex === rowIndex
          ? {
              ...r,
              computed: r.computed
                ? { ...r.computed, worked_dates: workedDates }
                : undefined,
            }
          : r,
      ),
    );
    // Optimistic; user can re-validate via the button below
  };

  const handleRevalidate = async () => {
    setLoading(true);
    try {
      const payload: RegularUploadRowInput[] = rows.map((r) => ({
        ...r.sheet,
        workedDates: r.computed?.worked_dates ?? null,
      }));
      const res = await revalidateRegularUpload(payrollPeriodId, payload);
      if (!res.ok) {
        toast.error(res.error?.message ?? "Failed to revalidate");
        return;
      }
      setRows(res.value.rows);
      setAuctionDates(res.value.auction_dates);
      toast.success("Re-validated");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    const valid = rows.filter((r) => r.isValid && r.employee_id && r.computed);
    if (!valid.length) {
      toast.error("No valid rows to apply");
      return;
    }
    setLoading(true);
    try {
      const payload: BulkUpsertUploadRow[] = valid.map((r) => ({
        employee_id: r.employee_id!,
        worked_dates: r.computed!.worked_dates,
        ot_hours: r.sheet.otHour ?? 0,
        ot_minutes: r.sheet.otMin ?? 0,
        earnings: r.computed!.earnings.map((e) => ({
          type: e.type,
          amount: e.amount,
          remarks: e.remarks ?? null,
        })),
        deductions: r.computed!.deductions.map((d) => ({
          type: d.type,
          amount: d.amount,
          remarks: d.remarks ?? null,
        })),
        remarks: null,
      }));
      const res = await confirmRegularUpload(payrollPeriodId, payload);
      if (!res.ok) {
        toast.error(res.error?.message ?? "Failed to apply");
        return;
      }
      toast.success(`Applied ${res.value.count} entries`);
      onOpenChange(false);
      reset();
      await onApplied?.();
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const validCount = rows.filter((r) => r.isValid).length;
  const warningCount = rows.filter((r) => r.isValid && r.warning).length;
  const errorCount = rows.filter((r) => !r.isValid).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Regular Sheet</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Upload an Excel file whose <span className="font-mono">Regular</span> tab follows the company payroll template.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.numbers,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Button onClick={() => inputRef.current?.click()} disabled={loading}>
              {loading ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <UploadIcon className="mr-2 h-4 w-4" />}
              Choose File
            </Button>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span>
                Period: <span className="font-mono">{periodStart}</span> – <span className="font-mono">{periodEnd}</span>
              </span>
              <span>Auction days: <span className="font-mono">{auctionDates.length}</span></span>
              <span className="text-emerald-600">Valid: {validCount}</span>
              {warningCount > 0 && (
                <span className="text-amber-600">Warnings: {warningCount}</span>
              )}
              {errorCount > 0 && (
                <span className="text-destructive">Errors: {errorCount}</span>
              )}
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRevalidate} disabled={loading}>
                  {loading && <Loader2Icon className="mr-2 h-3 w-3 animate-spin" />}
                  Re-validate
                </Button>
                <Button variant="outline" size="sm" onClick={() => setStep("upload")} disabled={loading}>
                  Choose Different File
                </Button>
              </div>
            </div>

            <RegularPreviewTable
              rows={rows}
              periodStart={periodStart}
              periodEnd={periodEnd}
              auctionDates={auctionDates}
              onRowWorkedDatesChange={handleRowChange}
            />

            <DialogFooter>
              <Button onClick={handleApply} disabled={loading || validCount === 0}>
                {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                Apply {validCount} {validCount === 1 ? "Entry" : "Entries"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
