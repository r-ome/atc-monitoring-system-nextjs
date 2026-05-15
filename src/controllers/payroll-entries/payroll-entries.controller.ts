import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { DatabaseOperationError, InputParseError, NotFoundError } from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { formatDate } from "@/app/lib/utils";
import { upsertPayrollEntrySchema } from "src/entities/models/PayrollEntry";
import type { PayrollEntryFullRow } from "src/application/repositories/payroll-entries.repository.interface";
import {
  listPayrollEntriesUseCase,
  getPayrollEntryUseCase,
  upsertPayrollEntryUseCase,
  deletePayrollEntryUseCase,
  bulkGenerateEntriesUseCase,
  markEntryPaidUseCase,
} from "src/application/use-cases/payroll-entries";

function presentEntry(entry: PayrollEntryFullRow) {
  return {
    payroll_entry_id: entry.payroll_entry_id,
    payroll_period_id: entry.payroll_period_id,
    employee_id: entry.employee_id,
    name_snapshot: entry.name_snapshot,
    position_snapshot: entry.position_snapshot,
    salary_type_snapshot: entry.salary_type_snapshot,
    worker_type_snapshot: entry.worker_type_snapshot,
    declaration_status_snapshot: entry.declaration_status_snapshot,
    daily_rate_snapshot: entry.daily_rate_snapshot?.toNumber() ?? null,
    monthly_salary_snapshot: entry.monthly_salary_snapshot?.toNumber() ?? null,
    auction_rate_snapshot: entry.auction_rate_snapshot?.toNumber() ?? null,
    ot_hour_rate_snapshot: entry.ot_hour_rate_snapshot?.toNumber() ?? null,
    ot_minute_rate_snapshot: entry.ot_minute_rate_snapshot?.toNumber() ?? null,
    ot_rate_is_manual: entry.ot_rate_is_manual,
    sss_snapshot: entry.sss_snapshot,
    philhealth_snapshot: entry.philhealth_snapshot,
    pagibig_snapshot: entry.pagibig_snapshot,
    tin_snapshot: entry.tin_snapshot,
    days_worked: entry.days_worked.toNumber(),
    days_leave_paid: entry.days_leave_paid.toNumber(),
    ot_hours: entry.ot_hours.toNumber(),
    ot_minutes: entry.ot_minutes.toNumber(),
    worked_dates: (entry.worked_dates as unknown) as
      | { date: string; type: "REGULAR" | "AUCTION" | "LEAVE" | "HOLIDAY"; rate?: number | null }[]
      | null,
    basic_pay: entry.basic_pay.toNumber(),
    gross_pay: entry.gross_pay.toNumber(),
    total_deductions: entry.total_deductions.toNumber(),
    net_pay: entry.net_pay.toNumber(),
    expense_id: entry.expense_id,
    remarks: entry.remarks,
    earnings: entry.earnings.map((e) => ({
      payroll_earning_id: e.payroll_earning_id,
      type: e.type,
      amount: e.amount.toNumber(),
      quantity: e.quantity?.toNumber() ?? null,
      rate: e.rate?.toNumber() ?? null,
      remarks: e.remarks,
    })),
    deductions: entry.deductions.map((d) => ({
      payroll_deduction_id: d.payroll_deduction_id,
      type: d.type,
      amount: d.amount.toNumber(),
      remarks: d.remarks,
    })),
    created_at: formatDate(entry.created_at, "MMM dd, yyyy"),
    updated_at: formatDate(entry.updated_at, "MMM dd, yyyy hh:mm a"),
  };
}

export const ListPayrollEntriesController = async (payroll_period_id: string) => {
  try {
    const entries = await listPayrollEntriesUseCase(payroll_period_id);
    return ok(entries.map(presentEntry));
  } catch (error) {
    logger("ListPayrollEntriesController", error);
    return err({ message: "Server Error", cause: "Failed to list payroll entries" });
  }
};

export const GetPayrollEntryController = async (payroll_entry_id: string) => {
  try {
    const entry = await getPayrollEntryUseCase(payroll_entry_id);
    return ok(presentEntry(entry));
  } catch (error) {
    logger("GetPayrollEntryController", error);
    if (error instanceof NotFoundError) return err({ message: error.message, cause: error.cause });
    return err({ message: "Server Error", cause: "Failed to get payroll entry" });
  }
};

export const UpsertPayrollEntryController = async (input: Record<string, unknown>) => {
  const ctx = RequestContext.getStore();
  try {
    const parsed = upsertPayrollEntrySchema.safeParse(input);
    if (!parsed.success) {
      throw new InputParseError("Invalid Data!", { cause: parsed.error.flatten().fieldErrors });
    }
    const entry = await upsertPayrollEntryUseCase(parsed.data);
    logger("UpsertPayrollEntryController", { employee_id: parsed.data.employee_id, username: ctx?.username }, "info");
    await logActivity("UPDATE", "payroll_entry", entry.payroll_entry_id, `Saved payroll entry for ${entry.name_snapshot}`);
    return ok(presentEntry(entry));
  } catch (error) {
    if (error instanceof InputParseError) return err({ message: error.message, cause: error.cause });
    logger("UpsertPayrollEntryController", error);
    if (error instanceof DatabaseOperationError) return err({ message: "Server Error", cause: error.message });
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};

export const DeletePayrollEntryController = async (payroll_entry_id: string) => {
  const ctx = RequestContext.getStore();
  try {
    await deletePayrollEntryUseCase(payroll_entry_id);
    logger("DeletePayrollEntryController", { payroll_entry_id, username: ctx?.username }, "info");
    await logActivity("DELETE", "payroll_entry", payroll_entry_id, `Deleted payroll entry`);
    return ok({ deleted: true });
  } catch (error) {
    logger("DeletePayrollEntryController", error);
    if (error instanceof NotFoundError || error instanceof DatabaseOperationError) {
      return err({ message: error.message, cause: error.cause });
    }
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};

export const BulkGenerateEntriesController = async (payroll_period_id: string, branch_id: string) => {
  const ctx = RequestContext.getStore();
  try {
    const entries = await bulkGenerateEntriesUseCase(payroll_period_id, branch_id);
    logger("BulkGenerateEntriesController", { payroll_period_id, username: ctx?.username }, "info");
    await logActivity("CREATE", "payroll_entry", payroll_period_id, `Generated ${entries.length} payroll entries`);
    return ok(entries.map(presentEntry));
  } catch (error) {
    logger("BulkGenerateEntriesController", error);
    if (error instanceof DatabaseOperationError) return err({ message: error.message, cause: error.cause });
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};

export const MarkEntryPaidController = async (
  payroll_entry_id: string,
  branch_id: string,
  pay_date: string,
) => {
  const ctx = RequestContext.getStore();
  try {
    const entry = await markEntryPaidUseCase(payroll_entry_id, {
      branch_id,
      remarks: `Payroll payout for ${(await getPayrollEntryUseCase(payroll_entry_id)).name_snapshot}`,
      created_at: new Date(pay_date),
    });
    logger("MarkEntryPaidController", { payroll_entry_id, username: ctx?.username }, "info");
    await logActivity("UPDATE", "payroll_entry", payroll_entry_id, `Marked payroll entry as paid for ${entry.name_snapshot}`);
    return ok(presentEntry(entry));
  } catch (error) {
    logger("MarkEntryPaidController", error);
    if (error instanceof NotFoundError || error instanceof DatabaseOperationError) {
      return err({ message: error.message, cause: error.cause });
    }
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};
