"use client";

import { useState } from "react";
import { AlertCircleIcon, AlertTriangleIcon, CheckCircle2Icon, CalendarIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
// (TooltipProvider wraps the whole table below; per-cell Tooltips share that provider.)
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { formatNumberToCurrency } from "@/app/lib/utils";
import type {
  FieldMismatch,
  RegularUploadResult,
} from "src/application/payroll/upload-regular-pipeline";
import type { WorkedDate } from "src/entities/models/PayrollEntry";
import {
  DEDUCTION_TYPE_LABELS,
  EARNING_TYPE_LABELS,
} from "src/entities/models/PayrollEntry";
import { WorkedDatesPicker } from "./WorkedDatesPicker";

interface Props {
  rows: RegularUploadResult[];
  periodStart: string;
  periodEnd: string;
  auctionDates: string[];
  onRowWorkedDatesChange: (rowIndex: number, dates: WorkedDate[]) => void;
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const StatusTooltipContent: React.FC<{ row: RegularUploadResult }> = ({ row }) => {
  if (row.error) {
    return <div className="text-xs">{row.error}</div>;
  }
  if (!row.mismatches?.length && !row.warningNotes?.length) {
    return <div className="text-xs">Valid</div>;
  }
  return (
    <div className="space-y-2 text-xs">
      {row.mismatches && row.mismatches.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Mismatches</div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] uppercase text-white">
                <th className="text-left py-0.5 pr-2">Field</th>
                <th className="text-right py-0.5 pr-2">Sheet</th>
                <th className="text-right py-0.5 pr-2">Computed</th>
                <th className="text-right py-0.5">Δ</th>
              </tr>
            </thead>
            <tbody>
              {row.mismatches.map((m: FieldMismatch) => (
                <tr key={m.field} className="border-t border-border/50">
                  <td className="py-0.5 pr-2">{m.field}</td>
                  <td className="py-0.5 pr-2 text-right tabular-nums">{fmt(m.sheet)}</td>
                  <td className="py-0.5 pr-2 text-right tabular-nums">{fmt(m.computed)}</td>
                  <td
                    className={`py-0.5 text-right tabular-nums ${m.delta < 0 ? "text-destructive" : "text-emerald-600"}`}
                  >
                    {m.delta >= 0 ? "+" : ""}
                    {fmt(m.delta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {row.warningNotes && row.warningNotes.length > 0 && (
        <ul className="list-disc list-inside space-y-0.5">
          {row.warningNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const RegularPreviewTable: React.FC<Props> = ({
  rows,
  periodStart,
  periodEnd,
  auctionDates,
  onRowWorkedDatesChange,
}) => {
  const [openRow, setOpenRow] = useState<number | null>(null);
  const sorted = [...rows].sort((a, b) => {
    const aSev = !a.isValid ? 0 : a.warning ? 1 : 2;
    const bSev = !b.isValid ? 0 : b.warning ? 1 : 2;
    if (aSev !== bSev) return aSev - bSev;
    return a.rowIndex - b.rowIndex;
  });

  return (
    <TooltipProvider delayDuration={150}>
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-2 py-1.5 w-8"></th>
            <th className="px-2 py-1.5">Name</th>
            <th className="px-2 py-1.5">Days</th>
            <th className="px-2 py-1.5 text-right">Basic</th>
            <th className="px-2 py-1.5 text-right">Gross</th>
            <th className="px-2 py-1.5 text-right">Deductions</th>
            <th className="px-2 py-1.5 text-right">Net</th>
            <th className="px-2 py-1.5 text-right">Sheet Net</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const rowCls = !r.isValid
              ? "bg-destructive/10"
              : r.warning
                ? "bg-amber-50 dark:bg-amber-950/30"
                : "";
            const c = r.computed;
            const wd = c?.worked_dates ?? [];
            const daysSummary = `R${wd.filter((d) => d.type === "REGULAR").length} · A${wd.filter((d) => d.type === "AUCTION").length} · L${wd.filter((d) => d.type === "LEAVE").length} · H${wd.filter((d) => d.type === "HOLIDAY").length}`;
            return (
              <tr key={r.rowIndex} className={`border-t ${rowCls}`}>
                <td className="px-2 py-1.5 align-top">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        {!r.isValid ? (
                          <AlertCircleIcon className="h-3.5 w-3.5 text-destructive" />
                        ) : r.warning ? (
                          <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-600" />
                        ) : (
                          <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md p-2">
                      <StatusTooltipContent row={r} />
                    </TooltipContent>
                  </Tooltip>
                </td>
                <td className="px-2 py-1.5 align-top">
                  <div className="font-medium">{r.name}</div>
                  {r.employee_snapshot_name && r.employee_snapshot_name !== r.name && (
                    <div className="text-[10px] text-muted-foreground">
                      → {r.employee_snapshot_name}
                    </div>
                  )}
                  {r.declaration_status && (
                    <div className="text-[10px] text-muted-foreground">
                      {r.declaration_status === "DECLARED" ? "Declared" : "Non-declared"}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5 align-top">
                  {r.isValid && c ? (
                    <Popover
                      open={openRow === r.rowIndex}
                      onOpenChange={(o) => setOpenRow(o ? r.rowIndex : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-[11px]">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {daysSummary}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[340px]" align="start">
                        <WorkedDatesPicker
                          periodStart={periodStart}
                          periodEnd={periodEnd}
                          auctionDates={auctionDates}
                          value={wd}
                          onChange={(next) => onRowWorkedDatesChange(r.rowIndex, next)}
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-right align-top tabular-nums">
                  {c ? formatNumberToCurrency(c.basic_pay) : "—"}
                </td>
                <td className="px-2 py-1.5 text-right align-top tabular-nums">
                  {c ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help underline decoration-dotted">
                          {formatNumberToCurrency(c.gross_pay)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs space-y-0.5">
                        <p className="font-medium">Gross Pay Breakdown</p>
                        {c.earnings.map((e, i) => (
                          <p key={i} className="text-white">
                            {EARNING_TYPE_LABELS[e.type] ?? e.type}:{" "}
                            <span className="font-mono">{formatNumberToCurrency(e.amount)}</span>
                          </p>
                        ))}
                        <p className="border-t border-white/30 pt-0.5 mt-0.5 font-semibold">
                          Gross: {formatNumberToCurrency(c.gross_pay)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-2 py-1.5 text-right align-top tabular-nums text-destructive">
                  {c ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help underline decoration-dotted">
                          {formatNumberToCurrency(c.total_deductions)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs space-y-0.5">
                        <p className="font-medium">Deductions Breakdown</p>
                        {c.deductions.length === 0 ? (
                          <p className="text-white">No deductions</p>
                        ) : (
                          c.deductions.map((d, i) => (
                            <p key={i} className="text-white">
                              {DEDUCTION_TYPE_LABELS[d.type] ?? d.type}:{" "}
                              <span className="font-mono">{formatNumberToCurrency(d.amount)}</span>
                            </p>
                          ))
                        )}
                        <p className="border-t border-white/30 pt-0.5 mt-0.5 font-semibold">
                          Total: {formatNumberToCurrency(c.total_deductions)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-2 py-1.5 text-right align-top tabular-nums font-semibold">
                  {c ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help underline decoration-dotted">
                          {formatNumberToCurrency(c.net_pay)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs space-y-0.5">
                        <p className="font-medium">Net Pay</p>
                        <p className="text-white">
                          Gross: <span className="font-mono">{formatNumberToCurrency(c.gross_pay)}</span>
                        </p>
                        <p className="text-white">
                          − Deductions:{" "}
                          <span className="font-mono">{formatNumberToCurrency(c.total_deductions)}</span>
                        </p>
                        <p className="border-t border-white/30 pt-0.5 mt-0.5 font-semibold">
                          = Net: {formatNumberToCurrency(c.net_pay)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-2 py-1.5 text-right align-top tabular-nums text-muted-foreground">
                  {r.sheet.netPay != null ? formatNumberToCurrency(r.sheet.netPay) : "—"}
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                No rows.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </TooltipProvider>
  );
};
