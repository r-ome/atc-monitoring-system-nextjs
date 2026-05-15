import { z } from "zod";
import { Prisma } from "@prisma/client";

export const PAYROLL_EARNING_TYPE = [
  "BASIC_PAY",
  "OVERTIME_HOUR",
  "OVERTIME_MINUTE",
  "AUCTION",
  "CONTAINER",
  "LEAVE_WITH_PAY",
  "HOLIDAY",
  "SSS_ALLOWANCE",
  "PHILHEALTH_ALLOWANCE",
  "PAGIBIG_ALLOWANCE",
  "OTHER_EARNING",
] as const;
export type PayrollEarningType = (typeof PAYROLL_EARNING_TYPE)[number];

export const EARNING_TYPE_LABELS: Record<PayrollEarningType, string> = {
  BASIC_PAY: "Basic Pay",
  OVERTIME_HOUR: "OT Pay (Hours)",
  OVERTIME_MINUTE: "OT Pay (Minutes)",
  AUCTION: "Auction",
  CONTAINER: "Container",
  LEAVE_WITH_PAY: "Leave With Pay",
  HOLIDAY: "Holiday",
  SSS_ALLOWANCE: "SSS Allowance",
  PHILHEALTH_ALLOWANCE: "PhilHealth Allowance",
  PAGIBIG_ALLOWANCE: "Pag-IBIG Allowance",
  OTHER_EARNING: "Other",
};

export const WORKED_DAY_TYPE = ["REGULAR", "AUCTION", "LEAVE", "HOLIDAY"] as const;
export type WorkedDayType = (typeof WORKED_DAY_TYPE)[number];

export type WorkedDate = {
  date: string; // ISO date YYYY-MM-DD
  type: WorkedDayType;
  rate?: number | null;
};

export const PAYROLL_DEDUCTION_TYPE = [
  "SSS",
  "PHILHEALTH",
  "PAGIBIG",
  "PAGIBIG_LOAN",
  "SLC",
  "LATE",
  "UNDERTIME",
  "OTHER_DEDUCTION",
] as const;
export type PayrollDeductionType = (typeof PAYROLL_DEDUCTION_TYPE)[number];

export const DEDUCTION_TYPE_LABELS: Record<PayrollDeductionType, string> = {
  SSS: "SSS",
  PHILHEALTH: "PhilHealth",
  PAGIBIG: "Pag-IBIG",
  PAGIBIG_LOAN: "Pag-IBIG Loan",
  SLC: "SLC / Company Loan",
  LATE: "Late",
  UNDERTIME: "Undertime",
  OTHER_DEDUCTION: "Other Deduction",
};

export type PayrollEntryRow = Prisma.payroll_entriesGetPayload<{
  include: { earnings: true; deductions: true; employee: true };
}>;

export type PayrollEarning = {
  payroll_earning_id: string;
  type: PayrollEarningType;
  amount: number;
  quantity?: number | null;
  rate?: number | null;
  remarks?: string | null;
};

export type PayrollDeduction = {
  payroll_deduction_id: string;
  type: PayrollDeductionType;
  amount: number;
  remarks?: string | null;
};

export type PayrollEntry = {
  payroll_entry_id: string;
  payroll_period_id: string;
  employee_id: string;
  name_snapshot: string;
  position_snapshot?: string | null;
  salary_type_snapshot: string;
  worker_type_snapshot: string;
  declaration_status_snapshot: string;
  daily_rate_snapshot?: number | null;
  monthly_salary_snapshot?: number | null;
  auction_rate_snapshot?: number | null;
  ot_hour_rate_snapshot?: number | null;
  ot_minute_rate_snapshot?: number | null;
  ot_rate_is_manual: boolean;
  sss_snapshot?: string | null;
  philhealth_snapshot?: string | null;
  pagibig_snapshot?: string | null;
  tin_snapshot?: string | null;
  days_worked: number;
  days_leave_paid: number;
  ot_hours: number;
  ot_minutes: number;
  worked_dates?: WorkedDate[] | null;
  basic_pay: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  expense_id?: string | null;
  remarks?: string | null;
  earnings: PayrollEarning[];
  deductions: PayrollDeduction[];
  created_at: string;
  updated_at: string;
};

const earningInputSchema = z.object({
  payroll_earning_id: z.string().optional(),
  type: z.enum(PAYROLL_EARNING_TYPE),
  amount: z.coerce.number().min(0),
  quantity: z.coerce.number().optional().nullable(),
  rate: z.coerce.number().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

const deductionInputSchema = z.object({
  payroll_deduction_id: z.string().optional(),
  type: z.enum(PAYROLL_DEDUCTION_TYPE),
  amount: z.coerce.number().min(0),
  remarks: z.string().optional().nullable(),
});

const workedDateSchema = z.object({
  date: z.string().min(1),
  type: z.enum(WORKED_DAY_TYPE),
  rate: z.coerce.number().optional().nullable(),
});

export const upsertPayrollEntrySchema = z.object({
  payroll_period_id: z.string().min(1),
  employee_id: z.string().min(1),
  days_worked: z.coerce.number().min(0).default(0),
  days_leave_paid: z.coerce.number().min(0).default(0),
  ot_hours: z.coerce.number().min(0).default(0),
  ot_minutes: z.coerce.number().min(0).default(0),
  ot_rate_is_manual: z.coerce.boolean().default(false),
  ot_hour_rate_snapshot: z.coerce.number().optional().nullable(),
  ot_minute_rate_snapshot: z.coerce.number().optional().nullable(),
  worked_dates: z.array(workedDateSchema).optional().nullable(),
  remarks: z.string().optional().nullable(),
  earnings: z.array(earningInputSchema).default([]),
  deductions: z.array(deductionInputSchema).default([]),
});

export type UpsertPayrollEntryInput = z.infer<typeof upsertPayrollEntrySchema>;
