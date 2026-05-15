"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/app/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import type { PayrollEntry } from "src/entities/models/PayrollEntry";
import { EARNING_TYPE_LABELS } from "src/entities/models/PayrollEntry";

function currency(v: number) {
  if (v === 0) return "—";
  return v.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const payrollEntryColumns: ColumnDef<PayrollEntry>[] = [
  {
    accessorKey: "name_snapshot",
    header: "Name",
    cell: ({ row }) => (
      <div className="font-medium whitespace-nowrap">
        {row.original.name_snapshot}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "days_worked",
    header: "Days",
    cell: ({ row }) => row.original.days_worked || "—",
  },
  {
    id: "basic_pay",
    header: "Basic Pay",
    cell: ({ row }) => {
      const e = row.original;
      const basic = e.earnings.find((x) => x.type === "BASIC_PAY")?.amount ?? 0;
      const isDaily = e.salary_type_snapshot === "DAILY_RATE";
      const rate = e.daily_rate_snapshot;
      const cell = <span className="tabular-nums">{currency(basic)}</span>;
      if (!isDaily || !rate || !e.days_worked) return cell;
      return (
        <Tooltip>
          <TooltipTrigger asChild>{cell}</TooltipTrigger>
          <TooltipContent side="right" className="p-0 min-w-[180px]">
            <div className="text-xs p-3 space-y-1 text-white">
              <div className="flex justify-between gap-6">
                <span className="text-white/70">Days Worked</span>
                <span className="tabular-nums font-medium">{e.days_worked}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-white/70">Daily Rate</span>
                <span className="tabular-nums font-medium">₱{Number(rate).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-white/20 pt-1 flex justify-between gap-6 font-semibold">
                <span>Basic Pay</span>
                <span className="tabular-nums">₱{Number(basic).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    id: "ot",
    header: "OT",
    cell: ({ row }) => {
      const e = row.original;
      const otH = e.ot_hours;
      const otM = e.ot_minutes;
      if (!otH && !otM) return "—";
      const parts = [];
      if (otH) parts.push(`${otH}h`);
      if (otM) parts.push(`${otM}m`);
      return <span className="text-xs">{parts.join(" ")}</span>;
    },
  },
  {
    id: "gross_pay",
    header: "Gross Pay",
    cell: ({ row }) => {
      const e = row.original;
      const hasBreakdown = e.earnings.length > 0;
      const cell = (
        <span className="tabular-nums font-medium text-amber-700">
          {currency(e.gross_pay)}
        </span>
      );
      if (!hasBreakdown) return cell;
      return (
        <Tooltip>
          <TooltipTrigger asChild>{cell}</TooltipTrigger>
          <TooltipContent side="left" className="p-0 min-w-[200px]">
            <div className="text-xs p-3 space-y-1 text-white">
              {e.earnings.map((earning) => (
                <div
                  key={earning.payroll_earning_id}
                  className="flex justify-between gap-6"
                >
                  <span className="text-white/70">
                    {EARNING_TYPE_LABELS[earning.type]}
                  </span>
                  <span className="tabular-nums font-medium">
                    ₱
                    {Number(earning.amount).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
              <div className="border-t border-white/20 pt-1 flex justify-between gap-6 font-semibold">
                <span>Gross Pay</span>
                <span className="tabular-nums text-amber-300">
                  ₱
                  {Number(e.gross_pay).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    id: "deductions",
    header: "Deductions",
    cell: ({ row }) => (
      <span className="tabular-nums text-red-600">
        {currency(row.original.total_deductions)}
      </span>
    ),
  },
  {
    id: "net_pay",
    header: "Net Pay",
    cell: ({ row }) => (
      <span
        className={`tabular-nums font-semibold ${row.original.net_pay < 0 ? "text-red-600" : "text-green-700"}`}
      >
        {currency(row.original.net_pay)}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.expense_id ? (
        <Badge variant="default" className="text-xs">
          Paid
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-xs">
          Unpaid
        </Badge>
      ),
  },
];
