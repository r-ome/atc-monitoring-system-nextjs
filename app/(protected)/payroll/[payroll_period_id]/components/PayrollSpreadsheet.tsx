"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { upsertPayrollEntry, deletePayrollEntry, markEntryPaid } from "../../actions";
import type { PayrollEntry, PayrollEarning, PayrollDeduction } from "src/entities/models/PayrollEntry";
import { computeBasicPay, computeOvertimeRates } from "src/application/payroll/compute";

// ─── Types ───────────────────────────────────────────────────────────────────

type Row = {
  payroll_entry_id: string;
  employee_id: string;
  name: string;
  salary_type: string;
  worker_type: string;
  // editable inputs
  daily_rate: string;
  days_worked: string;
  ot_hours: string;
  ot_minutes: string;
  auction: string;
  container: string;
  leave_with_pay: string;
  holiday: string;
  philhealth: string;
  pagibig: string;
  sss: string;
  pagibig_loan: string;
  others: string;
  slc: string;
  late: string;
  undertime: string;
  days_leave_paid: string;
  // snapshot
  ot_hour_rate: number | null;
  ot_minute_rate: number | null;
  ot_rate_is_manual: boolean;
  monthly_salary: number | null;
  // preserved misc earnings/deductions not shown as columns
  extra_earnings: PayrollEarning[];
  extra_deductions: PayrollDeduction[];
  // state
  expense_id: string | null;
  isDirty: boolean;
  isSaving: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function n(s: string): number {
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v;
}

function fmt(v: number): string {
  if (v === 0) return "";
  return v.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeRow(row: Row) {
  const dailyRate = n(row.daily_rate);
  const daysWorked = n(row.days_worked);
  const otHours = n(row.ot_hours);
  const otMinutes = n(row.ot_minutes);

  const basicPay = computeBasicPay({
    salary_type: row.salary_type as "FIXED_MONTHLY" | "DAILY_RATE" | "TASK_BASED",
    daily_rate: dailyRate,
    monthly_salary: row.monthly_salary,
    days_worked: daysWorked,
  });

  let otHourRate = row.ot_hour_rate;
  let otMinuteRate = row.ot_minute_rate;
  if (!row.ot_rate_is_manual && dailyRate > 0) {
    const auto = computeOvertimeRates(dailyRate);
    otHourRate = auto.ot_hour_rate;
    otMinuteRate = auto.ot_minute_rate;
  }

  const otHourPay = Math.round(otHours * (otHourRate ?? 0) * 100) / 100;
  const otMinutePay = Math.round(otMinutes * (otMinuteRate ?? 0) * 100) / 100;

  const grossPay =
    basicPay +
    otHourPay +
    otMinutePay +
    n(row.auction) +
    n(row.container) +
    n(row.leave_with_pay) +
    n(row.holiday) +
    row.extra_earnings.reduce((s, e) => s + e.amount, 0);

  const totalDeductions =
    n(row.philhealth) +
    n(row.pagibig) +
    n(row.sss) +
    n(row.pagibig_loan) +
    n(row.others) +
    n(row.slc) +
    n(row.late) +
    n(row.undertime) +
    row.extra_deductions.reduce((s, d) => s + d.amount, 0);

  const netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

  return { basicPay, otHourPay, otMinutePay, grossPay, totalDeductions, netPay, otHourRate, otMinuteRate };
}

function entryToRow(entry: PayrollEntry): Row {
  const getEarning = (type: string) =>
    String(entry.earnings.find((e) => e.type === type)?.amount ?? "");

  const getDeduction = (type: string) =>
    String(entry.deductions.find((d) => d.type === type)?.amount ?? "");

  const STANDARD_EARNING_TYPES = new Set([
    "BASIC_PAY", "OVERTIME_HOUR", "OVERTIME_MINUTE",
    "AUCTION", "CONTAINER", "LEAVE_WITH_PAY", "HOLIDAY",
  ]);
  const STANDARD_DEDUCTION_TYPES = new Set([
    "SSS", "PHILHEALTH", "PAGIBIG", "PAGIBIG_LOAN",
    "OTHERS", "SLC", "LATE", "UNDERTIME",
  ]);

  return {
    payroll_entry_id: entry.payroll_entry_id,
    employee_id: entry.employee_id,
    name: entry.name_snapshot,
    salary_type: entry.salary_type_snapshot,
    worker_type: entry.worker_type_snapshot,
    daily_rate: entry.daily_rate_snapshot ? String(entry.daily_rate_snapshot) : "",
    days_worked: entry.days_worked > 0 ? String(entry.days_worked) : "",
    ot_hours: entry.ot_hours > 0 ? String(entry.ot_hours) : "",
    ot_minutes: entry.ot_minutes > 0 ? String(entry.ot_minutes) : "",
    auction: getEarning("AUCTION"),
    container: getEarning("CONTAINER"),
    leave_with_pay: getEarning("LEAVE_WITH_PAY"),
    holiday: getEarning("HOLIDAY"),
    philhealth: getDeduction("PHILHEALTH"),
    pagibig: getDeduction("PAGIBIG"),
    sss: getDeduction("SSS"),
    pagibig_loan: getDeduction("PAGIBIG_LOAN"),
    others: getDeduction("OTHERS"),
    slc: getDeduction("SLC"),
    late: getDeduction("LATE"),
    undertime: getDeduction("UNDERTIME"),
    days_leave_paid: entry.days_leave_paid > 0 ? String(entry.days_leave_paid) : "",
    ot_hour_rate: entry.ot_hour_rate_snapshot ?? null,
    ot_minute_rate: entry.ot_minute_rate_snapshot ?? null,
    ot_rate_is_manual: entry.ot_rate_is_manual,
    monthly_salary: entry.monthly_salary_snapshot ?? null,
    extra_earnings: entry.earnings.filter((e) => !STANDARD_EARNING_TYPES.has(e.type)),
    extra_deductions: entry.deductions.filter((d) => !STANDARD_DEDUCTION_TYPES.has(d.type)),
    expense_id: entry.expense_id ?? null,
    isDirty: false,
    isSaving: false,
  };
}

// ─── Cell ─────────────────────────────────────────────────────────────────────

interface CellProps {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  readOnly?: boolean;
  isComputed?: boolean;
  computedValue?: string;
  highlight?: "gross" | "net";
  negative?: boolean;
  align?: "left" | "right" | "center";
  className?: string;
}

const Cell: React.FC<CellProps> = ({
  value,
  onChange,
  onBlur,
  readOnly,
  isComputed,
  computedValue,
  highlight,
  negative,
  align = "right",
  className,
}) => {
  if (isComputed) {
    return (
      <td
        className={cn(
          "px-1 py-0 text-xs whitespace-nowrap border-r border-gray-300",
          highlight === "gross" && "bg-yellow-50 font-medium",
          highlight === "net" && negative ? "bg-red-50 text-red-700 font-semibold" : highlight === "net" && "bg-green-50 font-semibold",
          align === "right" && "text-right",
          align === "center" && "text-center",
          className,
        )}
        style={{ minWidth: 72, padding: "1px 4px" }}
      >
        {computedValue}
      </td>
    );
  }

  if (readOnly) {
    return (
      <td
        className={cn(
          "px-1 py-0 text-xs whitespace-nowrap border-r border-gray-300 bg-gray-50",
          align === "right" && "text-right",
          className,
        )}
        style={{ minWidth: 48, padding: "1px 4px" }}
      >
        {value}
      </td>
    );
  }

  return (
    <td
      className={cn("border-r border-gray-300 p-0", className)}
      style={{ minWidth: 56 }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          "w-full text-xs bg-transparent border-none outline-none focus:bg-blue-50",
          "h-full",
          align === "right" && "text-right",
          align === "center" && "text-center",
        )}
        style={{ padding: "1px 4px", minWidth: 48 }}
      />
    </td>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  entries: PayrollEntry[];
  isDraft: boolean;
  isAdmin: boolean;
  periodId: string;
}

export const PayrollSpreadsheet: React.FC<Props> = ({ entries, isDraft, isAdmin, periodId: _periodId }) => {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => entries.map(entryToRow));
  const [paying, setPaying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Sync when entries prop changes (after router.refresh)
  useEffect(() => {
    setRows(entries.map(entryToRow));
  }, [entries]);

  const updateField = useCallback(
    (entryId: string, field: keyof Row, value: string) => {
      setRows((prev) =>
        prev.map((r) =>
          r.payroll_entry_id === entryId ? { ...r, [field]: value, isDirty: true } : r,
        ),
      );
    },
    [],
  );

  const scheduleSave = useCallback(
    (entryId: string) => {
      if (saveTimers.current[entryId]) clearTimeout(saveTimers.current[entryId]);
      saveTimers.current[entryId] = setTimeout(() => {
        setRows((prev) => {
          const row = prev.find((r) => r.payroll_entry_id === entryId);
          if (!row || !row.isDirty) return prev;
          doSave(row, prev);
          return prev;
        });
      }, 600);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const doSave = async (row: Row, allRows: Row[]) => {
    setRows((prev) =>
      prev.map((r) => (r.payroll_entry_id === row.payroll_entry_id ? { ...r, isSaving: true } : r)),
    );

    const { otHourPay, otMinutePay, otHourRate, otMinuteRate } = computeRow(row);
    const dw = n(row.days_worked);
    const otH = n(row.ot_hours);
    const otM = n(row.ot_minutes);

    const earnings = [
      ...(n(row.auction) > 0 ? [{ type: "AUCTION" as const, amount: n(row.auction) }] : []),
      ...(n(row.container) > 0 ? [{ type: "CONTAINER" as const, amount: n(row.container) }] : []),
      ...(n(row.leave_with_pay) > 0 ? [{ type: "LEAVE_WITH_PAY" as const, amount: n(row.leave_with_pay) }] : []),
      ...(n(row.holiday) > 0 ? [{ type: "HOLIDAY" as const, amount: n(row.holiday) }] : []),
      ...row.extra_earnings.map((e) => ({ type: e.type, amount: e.amount, quantity: e.quantity ?? undefined, rate: e.rate ?? undefined })),
    ];

    const deductions = [
      ...(n(row.philhealth) > 0 ? [{ type: "PHILHEALTH" as const, amount: n(row.philhealth) }] : []),
      ...(n(row.pagibig) > 0 ? [{ type: "PAGIBIG" as const, amount: n(row.pagibig) }] : []),
      ...(n(row.sss) > 0 ? [{ type: "SSS" as const, amount: n(row.sss) }] : []),
      ...(n(row.pagibig_loan) > 0 ? [{ type: "PAGIBIG_LOAN" as const, amount: n(row.pagibig_loan) }] : []),
      ...(n(row.others) > 0 ? [{ type: "OTHER_DEDUCTION" as const, amount: n(row.others) }] : []),
      ...(n(row.slc) > 0 ? [{ type: "SLC" as const, amount: n(row.slc) }] : []),
      ...(n(row.late) > 0 ? [{ type: "LATE" as const, amount: n(row.late) }] : []),
      ...(n(row.undertime) > 0 ? [{ type: "UNDERTIME" as const, amount: n(row.undertime) }] : []),
      ...row.extra_deductions.map((d) => ({ type: d.type, amount: d.amount })),
    ];

    const payload = {
      payroll_period_id: _periodId,
      employee_id: row.employee_id,
      days_worked: dw,
      days_leave_paid: n(row.days_leave_paid),
      ot_hours: otH,
      ot_minutes: otM,
      ot_rate_is_manual: row.ot_rate_is_manual,
      ot_hour_rate_snapshot: row.ot_rate_is_manual ? (otHourRate ?? null) : null,
      ot_minute_rate_snapshot: row.ot_rate_is_manual ? (otMinuteRate ?? null) : null,
      remarks: null,
      earnings,
      deductions,
    };

    void otHourPay;
    void otMinutePay;
    void allRows;

    const res = await upsertPayrollEntry(payload);
    if (res.ok) {
      setRows((prev) =>
        prev.map((r) =>
          r.payroll_entry_id === row.payroll_entry_id
            ? { ...r, isDirty: false, isSaving: false }
            : r,
        ),
      );
    } else {
      toast.error(`Save failed for ${row.name}: ${res.error?.message ?? "Unknown error"}`);
      setRows((prev) =>
        prev.map((r) =>
          r.payroll_entry_id === row.payroll_entry_id ? { ...r, isSaving: false } : r,
        ),
      );
    }
  };

  const handleBlur = useCallback(
    (entryId: string) => {
      scheduleSave(entryId);
    },
    [scheduleSave],
  );

  const handlePay = async (row: Row) => {
    if (!confirm(`Mark ${row.name} as paid? Net Pay: ₱${computeRow(row).netPay.toLocaleString()}`)) return;
    setPaying(row.payroll_entry_id);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await markEntryPaid(row.payroll_entry_id, today);
      if (res.ok) {
        toast.success("Marked as paid!");
        router.refresh();
      } else {
        toast.error(res.error?.message ?? "Error");
      }
    } finally {
      setPaying(null);
    }
  };

  const handleDelete = async (row: Row) => {
    if (!confirm(`Delete entry for ${row.name}?`)) return;
    setDeleting(row.payroll_entry_id);
    try {
      const res = await deletePayrollEntry(row.payroll_entry_id);
      if (res.ok) {
        toast.success("Deleted");
        router.refresh();
      } else {
        toast.error(res.error?.message ?? "Error");
      }
    } finally {
      setDeleting(null);
    }
  };

  // Totals
  const totals = rows.reduce(
    (acc, row) => {
      const { basicPay, otHourPay, otMinutePay, grossPay, netPay } = computeRow(row);
      return {
        basicPay: acc.basicPay + basicPay,
        otHourPay: acc.otHourPay + otHourPay,
        otMinutePay: acc.otMinutePay + otMinutePay,
        auction: acc.auction + n(row.auction),
        container: acc.container + n(row.container),
        leaveWithPay: acc.leaveWithPay + n(row.leave_with_pay),
        holiday: acc.holiday + n(row.holiday),
        grossPay: acc.grossPay + grossPay,
        philhealth: acc.philhealth + n(row.philhealth),
        pagibig: acc.pagibig + n(row.pagibig),
        sss: acc.sss + n(row.sss),
        pagibigLoan: acc.pagibigLoan + n(row.pagibig_loan),
        others: acc.others + n(row.others),
        slc: acc.slc + n(row.slc),
        late: acc.late + n(row.late),
        undertime: acc.undertime + n(row.undertime),
        netPay: acc.netPay + netPay,
      };
    },
    {
      basicPay: 0, otHourPay: 0, otMinutePay: 0, auction: 0, container: 0,
      leaveWithPay: 0, holiday: 0, grossPay: 0, philhealth: 0, pagibig: 0,
      sss: 0, pagibigLoan: 0, others: 0, slc: 0, late: 0, undertime: 0, netPay: 0,
    },
  );

  const headerCls = "px-1 py-1 text-center text-white font-semibold text-[10px] uppercase tracking-tight border-r border-teal-600 whitespace-nowrap";
  const totalCls = "px-1 py-1 text-right text-xs font-semibold bg-orange-50 border-r border-gray-300 whitespace-nowrap";

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No entries yet. Click &quot;Generate from Employees&quot; or &quot;Add Entry&quot;.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-300 shadow-sm">
      <table className="border-collapse text-xs" style={{ fontSize: 11 }}>
        <thead>
          <tr className="bg-teal-700 text-white">
            <th className={cn(headerCls, "sticky left-0 z-10 bg-teal-700 text-left")} style={{ minWidth: 24 }}>#</th>
            <th className={cn(headerCls, "sticky left-6 z-10 bg-teal-700 text-left")} style={{ minWidth: 160 }}>NAME</th>
            <th className={headerCls} style={{ minWidth: 60 }}>NEW<br />RATE</th>
            <th className={headerCls} style={{ minWidth: 52 }}>NO. OF<br />DAYS</th>
            <th className={headerCls} style={{ minWidth: 76 }}>BASIC PAY</th>
            <th className={headerCls} style={{ minWidth: 52 }}>OT<br />HOUR</th>
            <th className={headerCls} style={{ minWidth: 68 }}>O.T. PAY</th>
            <th className={headerCls} style={{ minWidth: 56 }}>OT PER<br />MINUTE</th>
            <th className={headerCls} style={{ minWidth: 68 }}>OT PAY</th>
            <th className={headerCls} style={{ minWidth: 68 }}>AUCTION</th>
            <th className={headerCls} style={{ minWidth: 72 }}>CONTAINER</th>
            <th className={headerCls} style={{ minWidth: 68 }}>LEAVE<br />W/ PAY</th>
            <th className={headerCls} style={{ minWidth: 64 }}>HOLIDAY</th>
            <th className={cn(headerCls, "bg-yellow-600")} style={{ minWidth: 80 }}>GROSS PAY</th>
            <th className={headerCls} style={{ minWidth: 72 }}>PHILHEALTH</th>
            <th className={headerCls} style={{ minWidth: 64 }}>PAG IBIG</th>
            <th className={headerCls} style={{ minWidth: 56 }}>SSS</th>
            <th className={headerCls} style={{ minWidth: 80 }}>PAG IBIG<br />LOAN</th>
            <th className={headerCls} style={{ minWidth: 60 }}>OTHERS</th>
            <th className={headerCls} style={{ minWidth: 52 }}>SLC</th>
            <th className={headerCls} style={{ minWidth: 52 }}>LATE</th>
            <th className={headerCls} style={{ minWidth: 72 }}>UNDERTIME</th>
            <th className={cn(headerCls, "bg-green-700")} style={{ minWidth: 84 }}>NET PAY</th>
            <th className={headerCls} style={{ minWidth: 52 }}>NO. OF<br />DAYS</th>
            <th className={headerCls} style={{ minWidth: 64 }}>NO. OF<br />LEAVE W/P</th>
            {isAdmin && <th className={headerCls} style={{ minWidth: 60 }}></th>}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => {
            const { basicPay, otHourPay, otMinutePay, grossPay, netPay } = computeRow(row);
            const isEven = idx % 2 === 0;
            const rowBg = row.isSaving
              ? "bg-blue-50"
              : row.isDirty
              ? "bg-amber-50"
              : isEven
              ? "bg-white"
              : "bg-gray-50/60";
            const readOnly = !isDraft || !isAdmin || !!row.expense_id;

            return (
              <tr key={row.payroll_entry_id} className={cn(rowBg, "border-b border-gray-200 hover:bg-blue-50/40 transition-colors")}>
                {/* # */}
                <td className="sticky left-0 z-10 text-center text-gray-400 border-r border-gray-300 font-medium"
                  style={{ padding: "1px 3px", minWidth: 24, background: "inherit" }}>
                  {idx + 1}
                </td>

                {/* NAME */}
                <td
                  className="sticky left-6 z-10 border-r border-gray-300 font-semibold text-left whitespace-nowrap"
                  style={{ padding: "1px 6px", minWidth: 160, background: "inherit" }}
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate max-w-[140px]">{row.name}</span>
                    {row.isSaving && <Loader2Icon className="h-2.5 w-2.5 animate-spin text-blue-400 flex-shrink-0" />}
                    {row.expense_id && <span className="text-[9px] text-green-600 font-normal">✓ PAID</span>}
                  </div>
                </td>

                {/* NEW RATE */}
                <Cell
                  value={row.daily_rate}
                  onChange={(v) => updateField(row.payroll_entry_id, "daily_rate", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* NO. OF DAYS */}
                <Cell
                  value={row.days_worked}
                  onChange={(v) => updateField(row.payroll_entry_id, "days_worked", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* BASIC PAY (computed) */}
                <Cell
                  value=""
                  onChange={() => {}}
                  onBlur={() => {}}
                  isComputed
                  computedValue={basicPay > 0 ? fmt(basicPay) : ""}
                />

                {/* OT HOUR */}
                <Cell
                  value={row.ot_hours}
                  onChange={(v) => updateField(row.payroll_entry_id, "ot_hours", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* O.T. PAY (computed) */}
                <Cell
                  value=""
                  onChange={() => {}}
                  onBlur={() => {}}
                  isComputed
                  computedValue={otHourPay > 0 ? fmt(otHourPay) : ""}
                />

                {/* OT PER MINUTE */}
                <Cell
                  value={row.ot_minutes}
                  onChange={(v) => updateField(row.payroll_entry_id, "ot_minutes", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* OT PAY (computed) */}
                <Cell
                  value=""
                  onChange={() => {}}
                  onBlur={() => {}}
                  isComputed
                  computedValue={otMinutePay > 0 ? fmt(otMinutePay) : ""}
                />

                {/* AUCTION */}
                <Cell
                  value={row.auction}
                  onChange={(v) => updateField(row.payroll_entry_id, "auction", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* CONTAINER */}
                <Cell
                  value={row.container}
                  onChange={(v) => updateField(row.payroll_entry_id, "container", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* LEAVE WITH PAY */}
                <Cell
                  value={row.leave_with_pay}
                  onChange={(v) => updateField(row.payroll_entry_id, "leave_with_pay", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* HOLIDAY */}
                <Cell
                  value={row.holiday}
                  onChange={(v) => updateField(row.payroll_entry_id, "holiday", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* GROSS PAY (computed, yellow) */}
                <Cell
                  value=""
                  onChange={() => {}}
                  onBlur={() => {}}
                  isComputed
                  computedValue={grossPay > 0 ? fmt(grossPay) : ""}
                  highlight="gross"
                />

                {/* PHILHEALTH */}
                <Cell
                  value={row.philhealth}
                  onChange={(v) => updateField(row.payroll_entry_id, "philhealth", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* PAG IBIG */}
                <Cell
                  value={row.pagibig}
                  onChange={(v) => updateField(row.payroll_entry_id, "pagibig", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* SSS */}
                <Cell
                  value={row.sss}
                  onChange={(v) => updateField(row.payroll_entry_id, "sss", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* PAG IBIG LOAN */}
                <Cell
                  value={row.pagibig_loan}
                  onChange={(v) => updateField(row.payroll_entry_id, "pagibig_loan", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* OTHERS */}
                <Cell
                  value={row.others}
                  onChange={(v) => updateField(row.payroll_entry_id, "others", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* SLC */}
                <Cell
                  value={row.slc}
                  onChange={(v) => updateField(row.payroll_entry_id, "slc", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* LATE */}
                <Cell
                  value={row.late}
                  onChange={(v) => updateField(row.payroll_entry_id, "late", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* UNDERTIME */}
                <Cell
                  value={row.undertime}
                  onChange={(v) => updateField(row.payroll_entry_id, "undertime", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                />

                {/* NET PAY (computed, green/red) */}
                <td
                  className={cn(
                    "border-r border-gray-300 text-right whitespace-nowrap font-semibold",
                    netPay < 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800",
                  )}
                  style={{ padding: "1px 4px", minWidth: 84 }}
                >
                  {grossPay > 0 || netPay !== 0 ? fmt(netPay) : ""}
                </td>

                {/* NO. OF DAYS (summary) */}
                <td className="text-center border-r border-gray-300 text-gray-600" style={{ padding: "1px 4px", minWidth: 52 }}>
                  {n(row.days_worked) > 0 ? n(row.days_worked) : ""}
                </td>

                {/* NO. OF LEAVE W/PAY */}
                <Cell
                  value={row.days_leave_paid}
                  onChange={(v) => updateField(row.payroll_entry_id, "days_leave_paid", v)}
                  onBlur={() => handleBlur(row.payroll_entry_id)}
                  readOnly={readOnly}
                  align="center"
                />

                {/* Actions */}
                {isAdmin && (
                  <td className="border-r border-gray-300 text-center" style={{ padding: "1px 3px", minWidth: 60 }}>
                    <div className="flex gap-0.5 justify-center">
                      {isDraft && !row.expense_id && (
                        <button
                          className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 whitespace-nowrap"
                          disabled={paying === row.payroll_entry_id}
                          onClick={() => handlePay(row)}
                        >
                          {paying === row.payroll_entry_id ? "…" : "Pay"}
                        </button>
                      )}
                      {isDraft && (
                        <button
                          className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-600 hover:bg-red-200"
                          disabled={deleting === row.payroll_entry_id}
                          onClick={() => handleDelete(row)}
                        >
                          {deleting === row.payroll_entry_id ? "…" : "×"}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>

        {/* Totals row */}
        <tfoot>
          <tr className="border-t-2 border-gray-400">
            <td colSpan={2} className="sticky left-0 z-10 bg-orange-50 border-r border-gray-300 text-right text-xs font-bold pr-2 py-1"
              style={{ minWidth: 184 }}>
              TOTAL
            </td>
            <td className={totalCls} />
            <td className={totalCls} />
            <td className={totalCls}>{totals.basicPay > 0 ? fmt(totals.basicPay) : ""}</td>
            <td className={totalCls} />
            <td className={totalCls}>{totals.otHourPay > 0 ? fmt(totals.otHourPay) : ""}</td>
            <td className={totalCls} />
            <td className={totalCls}>{totals.otMinutePay > 0 ? fmt(totals.otMinutePay) : ""}</td>
            <td className={totalCls}>{totals.auction > 0 ? fmt(totals.auction) : ""}</td>
            <td className={totalCls}>{totals.container > 0 ? fmt(totals.container) : ""}</td>
            <td className={totalCls}>{totals.leaveWithPay > 0 ? fmt(totals.leaveWithPay) : ""}</td>
            <td className={totalCls}>{totals.holiday > 0 ? fmt(totals.holiday) : ""}</td>
            <td className={cn(totalCls, "bg-yellow-100 font-bold")}>{fmt(totals.grossPay)}</td>
            <td className={totalCls}>{totals.philhealth > 0 ? fmt(totals.philhealth) : ""}</td>
            <td className={totalCls}>{totals.pagibig > 0 ? fmt(totals.pagibig) : ""}</td>
            <td className={totalCls}>{totals.sss > 0 ? fmt(totals.sss) : ""}</td>
            <td className={totalCls}>{totals.pagibigLoan > 0 ? fmt(totals.pagibigLoan) : ""}</td>
            <td className={totalCls}>{totals.others > 0 ? fmt(totals.others) : ""}</td>
            <td className={totalCls}>{totals.slc > 0 ? fmt(totals.slc) : ""}</td>
            <td className={totalCls}>{totals.late > 0 ? fmt(totals.late) : ""}</td>
            <td className={totalCls}>{totals.undertime > 0 ? fmt(totals.undertime) : ""}</td>
            <td className={cn(totalCls, "bg-green-100 font-bold text-green-800")}>{fmt(totals.netPay)}</td>
            <td className={totalCls} />
            <td className={totalCls} />
            {isAdmin && <td className={totalCls} />}
          </tr>
        </tfoot>
      </table>

      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 text-[10px] text-muted-foreground flex gap-4">
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-amber-200 border border-amber-400" /> Unsaved changes</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-blue-100 border border-blue-400" /> Saving…</span>
        <span className="flex items-center gap-1">Auto-saves on blur</span>
      </div>
    </div>
  );
};
