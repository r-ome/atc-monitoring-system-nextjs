import type {
  PayrollDeductionType,
  PayrollEarningType,
  UpsertPayrollEntryInput,
  WorkedDate,
} from "src/entities/models/PayrollEntry";
import type { Prisma } from "@prisma/client";

export type PayrollEntryFullRow = Prisma.payroll_entriesGetPayload<{
  include: { earnings: true; deductions: true; employee: true };
}>;

export type BulkUpsertUploadRow = {
  employee_id: string;
  days_worked?: number;
  days_leave_paid?: number;
  ot_hours?: number;
  ot_minutes?: number;
  worked_dates?: WorkedDate[] | null;
  earnings: { type: PayrollEarningType; amount: number; remarks?: string | null }[];
  deductions: { type: PayrollDeductionType; amount: number; remarks?: string | null }[];
  remarks?: string | null;
};

export interface IPayrollEntryRepository {
  getEntriesForPeriod(payroll_period_id: string): Promise<PayrollEntryFullRow[]>;
  getEntry(payroll_entry_id: string): Promise<PayrollEntryFullRow>;
  upsertEntry(input: UpsertPayrollEntryInput): Promise<PayrollEntryFullRow>;
  deleteEntry(payroll_entry_id: string): Promise<void>;
  bulkGenerateEntries(payroll_period_id: string, branch_id: string): Promise<PayrollEntryFullRow[]>;
  bulkUpsertFromUpload(
    payroll_period_id: string,
    rows: BulkUpsertUploadRow[],
  ): Promise<PayrollEntryFullRow[]>;
  markEntryPaid(
    payroll_entry_id: string,
    expense: { branch_id: string; remarks: string; created_at: Date }
  ): Promise<PayrollEntryFullRow>;
}
