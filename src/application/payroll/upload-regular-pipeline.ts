import type { PayrollSheetRow } from "@/app/lib/sheets";
import type { Employee, EmployeeRow } from "src/entities/models/Employee";
import type { WorkedDate } from "src/entities/models/PayrollEntry";
import {
  applyDeclarationRouting,
  buildEmployeeSnapshot,
  computeBasicPayFromDays,
  computeEntryTotals,
} from "./compute";
import { listDatesInRange } from "./auction-days";

export type RegularUploadRowInput = PayrollSheetRow & {
  // User overrides from the preview step
  workedDates?: WorkedDate[] | null;
};

export type RegularUploadEarning = {
  type:
    | "BASIC_PAY"
    | "OVERTIME_HOUR"
    | "OVERTIME_MINUTE"
    | "AUCTION"
    | "CONTAINER"
    | "LEAVE_WITH_PAY"
    | "HOLIDAY"
    | "SSS_ALLOWANCE"
    | "PHILHEALTH_ALLOWANCE"
    | "PAGIBIG_ALLOWANCE"
    | "OTHER_EARNING";
  amount: number;
  remarks?: string | null;
};

export type RegularUploadDeduction = {
  type:
    | "SSS"
    | "PHILHEALTH"
    | "PAGIBIG"
    | "PAGIBIG_LOAN"
    | "SLC"
    | "LATE"
    | "UNDERTIME"
    | "OTHER_DEDUCTION";
  amount: number;
  remarks?: string | null;
};

export type RegularUploadComputed = {
  basic_pay: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  earnings: RegularUploadEarning[];
  deductions: RegularUploadDeduction[];
  worked_dates: WorkedDate[];
};

export type FieldMismatch = {
  field: "Basic Pay" | "Gross Pay" | "Net Pay";
  sheet: number;
  computed: number;
  delta: number;
};

export type RegularUploadResult = {
  rowIndex: number;
  name: string;
  isValid: boolean;
  error?: string | null;
  warning?: string | null;
  warningNotes?: string[]; // non-mismatch notes (e.g. wrong worker_type)
  mismatches?: FieldMismatch[];
  employee_id?: string | null;
  employee_snapshot_name?: string | null;
  declaration_status?: "DECLARED" | "NON_DECLARED" | null;
  sheet: PayrollSheetRow;
  computed?: RegularUploadComputed;
  // Diff helpers for UI
  basic_pay_delta?: number | null;
  gross_pay_delta?: number | null;
  net_pay_delta?: number | null;
};

// ---------- helpers ----------

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim().replace(/\./g, "");
}

function fullName(emp: { first_name: string; middle_name?: string | null; last_name: string }): string {
  return [emp.first_name, emp.middle_name, emp.last_name]
    .filter((s) => s && s.trim())
    .join(" ");
}

function toNum(v: { toNumber?: () => number } | number | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && "toNumber" in v && typeof v.toNumber === "function") {
    return v.toNumber();
  }
  return null;
}

function matchEmployee(name: string, employees: EmployeeRow[]): EmployeeRow | null {
  const target = normalizeName(name);
  // Exact full-name match
  const exact = employees.find((e) => normalizeName(fullName(e)) === target);
  if (exact) return exact;
  // Tolerant: first+last only
  const noMiddle = employees.find(
    (e) => normalizeName(`${e.first_name} ${e.last_name}`) === target,
  );
  if (noMiddle) return noMiddle;
  // Last name first ordering (e.g. "DELA CRUZ, JUAN")
  const lastFirst = employees.find((e) => {
    const v = normalizeName(`${e.last_name} ${e.first_name}`);
    return v === target;
  });
  if (lastFirst) return lastFirst;
  return null;
}

// Seeds worked_dates from a count: takes the first N non-Sunday days in the
// cutoff. Auction days are pre-tagged from the period's auction date list.
function seedWorkedDates(
  period_start: Date,
  period_end: Date,
  daysCount: number,
  leaveCount: number,
  holidayCount: number,
  auctionISO: Set<string>,
): WorkedDate[] {
  const all = listDatesInRange(period_start, period_end);
  const result: WorkedDate[] = [];
  let leaveLeft = Math.max(0, Math.floor(leaveCount));
  let holidayLeft = Math.max(0, Math.floor(holidayCount));
  let workLeft = Math.max(0, Math.floor(daysCount));

  for (const iso of all) {
    const dow = new Date(iso + "T00:00:00Z").getUTCDay();
    if (auctionISO.has(iso) && workLeft > 0) {
      result.push({ date: iso, type: "AUCTION" });
      workLeft--;
      continue;
    }
    if (dow === 0) continue; // skip Sunday by default
    if (holidayLeft > 0) {
      result.push({ date: iso, type: "HOLIDAY" });
      holidayLeft--;
      continue;
    }
    if (leaveLeft > 0) {
      result.push({ date: iso, type: "LEAVE" });
      leaveLeft--;
      continue;
    }
    if (workLeft > 0) {
      result.push({ date: iso, type: "REGULAR" });
      workLeft--;
      continue;
    }
  }
  return result;
}

// ---------- main entry point ----------

export type ValidateRegularUploadInput = {
  rows: RegularUploadRowInput[];
  employees: EmployeeRow[];
  period: {
    period_start: Date;
    period_end: Date;
  };
  auctionDatesIso: string[];
};

export function validateRegularUpload(
  input: ValidateRegularUploadInput,
): RegularUploadResult[] {
  const auctionSet = new Set(input.auctionDatesIso);
  const nameCounts = new Map<string, number>();
  for (const r of input.rows) {
    const k = normalizeName(r.name);
    nameCounts.set(k, (nameCounts.get(k) ?? 0) + 1);
  }

  const out: RegularUploadResult[] = [];
  for (const row of input.rows) {
    const res: RegularUploadResult = {
      rowIndex: row.rowIndex,
      name: row.name,
      isValid: false,
      sheet: row,
    };

    if (!row.name || row.name.trim().length === 0) {
      res.error = "Missing NAME";
      out.push(res);
      continue;
    }
    if ((nameCounts.get(normalizeName(row.name)) ?? 0) > 1) {
      res.error = "Duplicate name in upload";
      out.push(res);
      continue;
    }

    const emp = matchEmployee(row.name, input.employees);
    if (!emp) {
      res.error = `Employee not found: ${row.name}`;
      out.push(res);
      continue;
    }

    res.employee_id = emp.employee_id;
    res.employee_snapshot_name = fullName(emp);
    res.declaration_status = (emp.declaration_status ?? "DECLARED") as
      | "DECLARED"
      | "NON_DECLARED";

    const warningNotes: string[] = [];
    const mismatches: FieldMismatch[] = [];
    if (emp.worker_type !== "REGULAR_WORKER") {
      warningNotes.push(`Employee is not a REGULAR_WORKER (worker_type=${emp.worker_type})`);
    }

    // Build worked_dates (use overrides if provided)
    const dailyRate = row.newRate ?? toNum(emp.default_daily_rate);
    const monthlySalary = toNum(emp.default_monthly_salary);
    const auctionRate = toNum(emp.default_auction_rate);

    const workedDates: WorkedDate[] =
      row.workedDates && row.workedDates.length > 0
        ? row.workedDates
        : seedWorkedDates(
            input.period.period_start,
            input.period.period_end,
            row.daysCount ?? row.daysWorkedRight ?? 0,
            row.leaveDays ?? 0,
            // approximate holiday-day count from holiday earning ÷ best-known rate
            (() => {
              const holidayPay = row.holiday ?? 0;
              const r = dailyRate && dailyRate > 0 ? dailyRate : monthlySalary && monthlySalary > 0 ? monthlySalary / 30 : 600;
              return r > 0 ? Math.round(holidayPay / r) : 0;
            })(),
            auctionSet,
          );

    const breakdown = computeBasicPayFromDays({
      salary_type: emp.salary_type,
      daily_rate: dailyRate,
      monthly_salary: monthlySalary,
      auction_rate: auctionRate,
      worked_dates: workedDates,
    });

    // OT computed off snapshot rates
    const snap = buildEmployeeSnapshot(emp);
    const otHourRate = snap.ot_hour_rate_snapshot ?? 0;
    const otMinuteRate = snap.ot_minute_rate_snapshot ?? 0;
    const otHours = row.otHour ?? 0;
    const otMinutes = row.otMin ?? 0;

    const earnings: RegularUploadEarning[] = [
      { type: "BASIC_PAY", amount: breakdown.basic_pay },
    ];
    if (otHours > 0 && otHourRate > 0) {
      earnings.push({
        type: "OVERTIME_HOUR",
        amount: Number((otHours * otHourRate).toFixed(2)),
      });
    }
    if (otMinutes > 0 && otMinuteRate > 0) {
      earnings.push({
        type: "OVERTIME_MINUTE",
        amount: Number((otMinutes * otMinuteRate).toFixed(2)),
      });
    }
    // Sheet's AUCTION column is the source of truth when present —
    // the period's auction-day count may differ from how the sheet was
    // built (e.g. period has 2 Saturdays but only 1 was an actual
    // auction). We only fall back to our auto-computed value when the
    // sheet has no AUCTION value at all.
    const sheetAuction = row.auction ?? 0;
    if (sheetAuction > 0) {
      earnings.push({ type: "AUCTION", amount: sheetAuction });
    } else if (breakdown.auction_earning > 0) {
      earnings.push({ type: "AUCTION", amount: breakdown.auction_earning });
    }
    if ((row.container ?? 0) > 0) {
      earnings.push({ type: "CONTAINER", amount: row.container ?? 0 });
    }
    if ((row.leaveWithPay ?? 0) > 0) {
      earnings.push({ type: "LEAVE_WITH_PAY", amount: row.leaveWithPay ?? 0 });
    }
    if ((row.holiday ?? 0) > 0) {
      earnings.push({ type: "HOLIDAY", amount: row.holiday ?? 0 });
    }

    const rawDeductions: RegularUploadDeduction[] = [];
    const pushIf = (type: RegularUploadDeduction["type"], amt: number | null) => {
      if (amt && amt > 0) rawDeductions.push({ type, amount: amt });
    };
    pushIf("SSS", row.sss);
    pushIf("PHILHEALTH", row.philhealth);
    pushIf("PAGIBIG", row.pagibig);
    pushIf("PAGIBIG_LOAN", row.pagibigLoan);
    pushIf("SLC", row.slc);
    pushIf("LATE", row.late);
    pushIf("UNDERTIME", row.undertime);
    pushIf("OTHER_DEDUCTION", row.others);

    const routed = applyDeclarationRouting(
      res.declaration_status,
      earnings,
      rawDeductions,
    );

    const totals = computeEntryTotals(routed.earnings, routed.deductions);

    res.computed = {
      basic_pay: breakdown.basic_pay,
      gross_pay: totals.gross_pay,
      total_deductions: totals.total_deductions,
      net_pay: totals.net_pay,
      earnings: routed.earnings as RegularUploadEarning[],
      deductions: routed.deductions as RegularUploadDeduction[],
      worked_dates: workedDates,
    };

    // Compare to sheet values
    const eq = (a: number | null | undefined, b: number) =>
      a == null ? false : Math.abs(a - b) < 0.5;
    const pushMismatch = (
      field: FieldMismatch["field"],
      sheet: number,
      computed: number,
    ) => {
      mismatches.push({ field, sheet, computed, delta: computed - sheet });
    };
    if (row.basicPay != null && !eq(row.basicPay, breakdown.basic_pay)) {
      pushMismatch("Basic Pay", row.basicPay, breakdown.basic_pay);
      res.basic_pay_delta = breakdown.basic_pay - (row.basicPay ?? 0);
    }
    // For non-declared employees we route SSS/PH/PI into earnings as
    // *_ALLOWANCE rows, which inflates our gross above what the sheet's
    // GROSS PAY column shows (the sheet leaves those amounts in the
    // deduction columns even when they're paid out). Subtract the
    // allowances so the comparison is apples-to-apples.
    const sheetEquivalentGross =
      res.declaration_status === "NON_DECLARED"
        ? totals.gross_pay -
          routed.earnings
            .filter(
              (e) =>
                e.type === "SSS_ALLOWANCE" ||
                e.type === "PHILHEALTH_ALLOWANCE" ||
                e.type === "PAGIBIG_ALLOWANCE",
            )
            .reduce((s, e) => s + e.amount, 0)
        : totals.gross_pay;
    if (row.grossPay != null && !eq(row.grossPay, sheetEquivalentGross)) {
      pushMismatch("Gross Pay", row.grossPay, sheetEquivalentGross);
      res.gross_pay_delta = sheetEquivalentGross - (row.grossPay ?? 0);
    }
    if (row.netPay != null && !eq(row.netPay, totals.net_pay)) {
      pushMismatch("Net Pay", row.netPay, totals.net_pay);
      res.net_pay_delta = totals.net_pay - (row.netPay ?? 0);
    }

    res.isValid = true;
    res.mismatches = mismatches.length ? mismatches : undefined;
    res.warningNotes = warningNotes.length ? warningNotes : undefined;
    if (mismatches.length || warningNotes.length) {
      // Keep a flat string for any legacy consumers
      const parts = [
        ...mismatches.map(
          (m) => `${m.field} mismatch: sheet ${m.sheet}, computed ${m.computed}`,
        ),
        ...warningNotes,
      ];
      res.warning = parts.join(" • ");
    }
    out.push(res);
  }

  return out;
}

// Re-export the Employee type alias for downstream callers that already import this module.
export type { Employee };
