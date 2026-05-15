import type { DeclarationStatus, SalaryType } from "src/entities/models/Employee";
import type {
  PayrollDeductionType,
  PayrollEarningType,
  WorkedDate,
} from "src/entities/models/PayrollEntry";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeOvertimeRates(dailyRate: number): {
  ot_hour_rate: number;
  ot_minute_rate: number;
} {
  const hourly = dailyRate / 8;
  const otHourly = hourly * 1.25;
  const otMinute = otHourly / 60;
  return {
    ot_hour_rate: Math.round(otHourly * 10000) / 10000,
    ot_minute_rate: Math.round(otMinute * 10000) / 10000,
  };
}

export function computeBasicPay(input: {
  salary_type: SalaryType;
  daily_rate?: number | null;
  monthly_salary?: number | null;
  days_worked: number;
}): number {
  switch (input.salary_type) {
    case "FIXED_MONTHLY":
      return round2(input.monthly_salary ?? 0);
    case "DAILY_RATE":
      return round2((input.daily_rate ?? 0) * input.days_worked);
    case "TASK_BASED":
      return 0;
  }
}

export type ComputedDaysBreakdown = {
  basic_pay: number;
  auction_earning: number; // additive AUCTION earning for FIXED_MONTHLY
  regular_days: number;
  auction_days: number;
  leave_days: number;
  holiday_days: number;
};

// Computes basic pay and extra-auction earning from a list of worked dates.
// FIXED_MONTHLY: basic stays = monthly_salary; AUCTION days produce a separate
// AUCTION earning (auction_rate per day) on top.
// DAILY_RATE: basic = sum of REGULAR (daily_rate) + AUCTION (auction_rate) days.
export function computeBasicPayFromDays(input: {
  salary_type: SalaryType;
  daily_rate?: number | null;
  monthly_salary?: number | null;
  auction_rate?: number | null;
  worked_dates: WorkedDate[];
}): ComputedDaysBreakdown {
  const daily = input.daily_rate ?? 0;
  const auctionRate = input.auction_rate ?? 0;
  const monthly = input.monthly_salary ?? 0;

  let regular = 0;
  let auction = 0;
  let leave = 0;
  let holiday = 0;
  for (const d of input.worked_dates) {
    switch (d.type) {
      case "REGULAR":
        regular++;
        break;
      case "AUCTION":
        auction++;
        break;
      case "LEAVE":
        leave++;
        break;
      case "HOLIDAY":
        holiday++;
        break;
    }
  }

  let basic = 0;
  let auctionEarning = 0;
  switch (input.salary_type) {
    case "FIXED_MONTHLY":
      basic = round2(monthly);
      auctionEarning = round2(auctionRate * auction);
      break;
    case "DAILY_RATE":
      basic = round2(daily * regular + auctionRate * auction);
      auctionEarning = 0;
      break;
    case "TASK_BASED":
      basic = 0;
      auctionEarning = 0;
      break;
  }

  return {
    basic_pay: basic,
    auction_earning: auctionEarning,
    regular_days: regular,
    auction_days: auction,
    leave_days: leave,
    holiday_days: holiday,
  };
}

export function computeEntryTotals(
  earnings: { amount: number }[],
  deductions: { amount: number }[],
): {
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
} {
  const gross = round2(earnings.reduce((s, e) => s + (Number(e.amount) || 0), 0));
  const totalDed = round2(deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0));
  return {
    gross_pay: gross,
    total_deductions: totalDed,
    net_pay: round2(gross - totalDed),
  };
}

// Reroutes SSS/PHILHEALTH/PAGIBIG between earnings and deductions
// based on the employee's declaration status. PAGIBIG_LOAN / SLC / LATE /
// UNDERTIME / OTHER_DEDUCTION are always real deductions.
export function applyDeclarationRouting(
  status: DeclarationStatus,
  earnings: { type: PayrollEarningType; amount: number; remarks?: string | null }[],
  deductions: { type: PayrollDeductionType; amount: number; remarks?: string | null }[],
): {
  earnings: { type: PayrollEarningType; amount: number; remarks?: string | null }[];
  deductions: { type: PayrollDeductionType; amount: number; remarks?: string | null }[];
} {
  if (status === "DECLARED") {
    return { earnings, deductions };
  }
  // NON_DECLARED: move SSS / PHILHEALTH / PAGIBIG deductions to *_ALLOWANCE earnings.
  const map: Record<string, PayrollEarningType> = {
    SSS: "SSS_ALLOWANCE",
    PHILHEALTH: "PHILHEALTH_ALLOWANCE",
    PAGIBIG: "PAGIBIG_ALLOWANCE",
  };
  const movedEarnings = [...earnings];
  const remainingDeductions: typeof deductions = [];
  for (const d of deductions) {
    if (map[d.type] && d.amount > 0) {
      movedEarnings.push({
        type: map[d.type],
        amount: d.amount,
        remarks: d.remarks ?? null,
      });
    } else if (d.type === "SSS" || d.type === "PHILHEALTH" || d.type === "PAGIBIG") {
      // zero-amount statutory rows: drop silently
    } else {
      remainingDeductions.push(d);
    }
  }
  return { earnings: movedEarnings, deductions: remainingDeductions };
}

// Build snapshot fields from a raw employee row — safe for server use only
export function buildEmployeeSnapshot(employee: {
  first_name: string;
  last_name: string;
  position?: string | null;
  salary_type: SalaryType;
  worker_type: string;
  declaration_status?: DeclarationStatus | null;
  default_daily_rate?: { toNumber: () => number } | number | null;
  default_monthly_salary?: { toNumber: () => number } | number | null;
  default_auction_rate?: { toNumber: () => number } | number | null;
  default_ot_hour_rate?: { toNumber: () => number } | number | null;
  default_ot_minute_rate?: { toNumber: () => number } | number | null;
  sss_number?: string | null;
  philhealth_number?: string | null;
  pagibig_number?: string | null;
  tin?: string | null;
}) {
  const toNum = (v: unknown): number | null => {
    if (v == null) return null;
    if (typeof v === "number") return v;
    if (typeof v === "object" && v !== null && "toNumber" in v) {
      return (v as { toNumber: () => number }).toNumber();
    }
    return null;
  };

  const dailyRate = toNum(employee.default_daily_rate);
  const explicitOtHour = toNum(employee.default_ot_hour_rate);
  const explicitOtMinute = toNum(employee.default_ot_minute_rate);
  const autoRates = dailyRate != null ? computeOvertimeRates(dailyRate) : null;

  return {
    name_snapshot: `${employee.first_name} ${employee.last_name}`.trim(),
    position_snapshot: employee.position ?? null,
    salary_type_snapshot: employee.salary_type,
    worker_type_snapshot: employee.worker_type,
    declaration_status_snapshot: employee.declaration_status ?? "DECLARED",
    daily_rate_snapshot: dailyRate,
    monthly_salary_snapshot: toNum(employee.default_monthly_salary),
    auction_rate_snapshot: toNum(employee.default_auction_rate),
    ot_hour_rate_snapshot: explicitOtHour ?? autoRates?.ot_hour_rate ?? null,
    ot_minute_rate_snapshot: explicitOtMinute ?? autoRates?.ot_minute_rate ?? null,
    ot_rate_is_manual: !!(explicitOtHour || explicitOtMinute),
    sss_snapshot: employee.sss_number ?? null,
    philhealth_snapshot: employee.philhealth_number ?? null,
    pagibig_snapshot: employee.pagibig_number ?? null,
    tin_snapshot: employee.tin ?? null,
  };
}
