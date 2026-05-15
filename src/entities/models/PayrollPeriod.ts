import { z } from "zod";
import { Prisma } from "@prisma/client";

export const PAYROLL_RUN_STATUS = ["DRAFT", "POSTED", "VOID"] as const;
export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUS)[number];

export type PayrollPeriodRow = Prisma.payroll_periodsGetPayload<object>;

export type PayrollPeriodWithCountsRow = PayrollPeriodRow & {
  _count: { entries: number };
};

export type PayrollPeriod = {
  payroll_period_id: string;
  branch_id: string;
  label: string;
  period_start: string;
  period_end: string;
  pay_date?: string | null;
  status: PayrollRunStatus;
  posted_at?: string | null;
  posted_by?: string | null;
  remarks?: string | null;
  entry_count: number;
  total_net_pay: number;
  created_at: string;
  updated_at: string;
};

// period_start must be day 1 or 16; period_end must be day 15 or last-of-month
export const createPayrollPeriodSchema = z.object({
  branch_id: z.string().min(1),
  label: z.string().min(1),
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  pay_date: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type CreatePayrollPeriodInput = z.infer<typeof createPayrollPeriodSchema>;
