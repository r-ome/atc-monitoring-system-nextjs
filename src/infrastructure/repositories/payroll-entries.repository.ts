import {
  IPayrollEntryRepository,
  PayrollEntryFullRow,
} from "src/application/repositories/payroll-entries.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { NotFoundError, DatabaseOperationError } from "src/entities/errors/common";
import { isPrismaError, isPrismaValidationError } from "@/app/lib/error-handler";
import {
  computeBasicPay,
  computeBasicPayFromDays,
  computeEntryTotals,
  buildEmployeeSnapshot,
  applyDeclarationRouting,
} from "src/application/payroll/compute";
import type { UpsertPayrollEntryInput, WorkedDate } from "src/entities/models/PayrollEntry";
import { Prisma } from "@prisma/client";
import type {
  declaration_status,
  payroll_deduction_type,
  payroll_earning_type,
  salary_type,
  worker_type,
} from "@prisma/client";

const ENTRY_INCLUDE = {
  earnings: true,
  deductions: true,
  employee: true,
} as const;

function getEntry(payroll_entry_id: string): Promise<PayrollEntryFullRow> {
  return prisma.payroll_entries.findFirstOrThrow({
    where: { payroll_entry_id, deleted_at: null },
    include: ENTRY_INCLUDE,
  });
}

export const PayrollEntryRepository: IPayrollEntryRepository = {
  getEntriesForPeriod: async (payroll_period_id) => {
    try {
      return await prisma.payroll_entries.findMany({
        where: { payroll_period_id, deleted_at: null },
        include: ENTRY_INCLUDE,
        orderBy: { name_snapshot: "asc" },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting payroll entries!", { cause: error.message });
      }
      throw error;
    }
  },

  getEntry: async (payroll_entry_id) => {
    try {
      const entry = await prisma.payroll_entries.findFirst({
        where: { payroll_entry_id, deleted_at: null },
        include: ENTRY_INCLUDE,
      });
      if (!entry) throw new NotFoundError("Payroll entry not found!");
      return entry;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting payroll entry!", { cause: error.message });
      }
      throw error;
    }
  },

  upsertEntry: async (input: UpsertPayrollEntryInput) => {
    try {
      const employee = await prisma.employees.findFirstOrThrow({
        where: { employee_id: input.employee_id, deleted_at: null },
      });

      const snapshot = buildEmployeeSnapshot(employee);

      // Override OT rates if manual
      const otHourRate = input.ot_rate_is_manual && input.ot_hour_rate_snapshot != null
        ? input.ot_hour_rate_snapshot
        : (snapshot.ot_hour_rate_snapshot ?? null);

      const otMinuteRate = input.ot_rate_is_manual && input.ot_minute_rate_snapshot != null
        ? input.ot_minute_rate_snapshot
        : (snapshot.ot_minute_rate_snapshot ?? null);

      const workedDates: WorkedDate[] = input.worked_dates ?? [];
      const hasWorkedDates = workedDates.length > 0;

      const breakdown = hasWorkedDates
        ? computeBasicPayFromDays({
            salary_type: snapshot.salary_type_snapshot,
            daily_rate: snapshot.daily_rate_snapshot,
            monthly_salary: snapshot.monthly_salary_snapshot,
            auction_rate: snapshot.auction_rate_snapshot,
            worked_dates: workedDates,
          })
        : null;

      const basicPay = breakdown
        ? breakdown.basic_pay
        : computeBasicPay({
            salary_type: snapshot.salary_type_snapshot,
            daily_rate: snapshot.daily_rate_snapshot,
            monthly_salary: snapshot.monthly_salary_snapshot,
            days_worked: input.days_worked,
          });

      const derivedDaysWorked = breakdown
        ? breakdown.regular_days + breakdown.auction_days
        : input.days_worked;
      const derivedLeaveDays = breakdown ? breakdown.leave_days : input.days_leave_paid;

      // Build OT earnings from inputs
      const autoEarnings = input.earnings.filter(
        (e) => e.type !== "OVERTIME_HOUR" && e.type !== "OVERTIME_MINUTE" && e.type !== "BASIC_PAY"
      );

      const basicPayEarning = {
        type: "BASIC_PAY" as const,
        amount: basicPay,
        quantity: null,
        rate: null,
        remarks: null,
      };

      const otHourEarning = input.ot_hours > 0 && otHourRate
        ? {
            type: "OVERTIME_HOUR" as const,
            amount: Number((input.ot_hours * otHourRate).toFixed(2)),
            quantity: input.ot_hours,
            rate: otHourRate,
            remarks: null,
          }
        : null;

      const otMinuteEarning = input.ot_minutes > 0 && otMinuteRate
        ? {
            type: "OVERTIME_MINUTE" as const,
            amount: Number((input.ot_minutes * otMinuteRate).toFixed(2)),
            quantity: input.ot_minutes,
            rate: otMinuteRate,
            remarks: null,
          }
        : null;

      const autoAuctionEarning = breakdown && breakdown.auction_earning > 0
        ? {
            type: "AUCTION" as const,
            amount: breakdown.auction_earning,
            quantity: breakdown.auction_days,
            rate: snapshot.auction_rate_snapshot ?? null,
            remarks: null,
          }
        : null;

      // When worked_dates drives the breakdown, drop any user-supplied AUCTION
      // earning rows — the auto computation is authoritative.
      const extraEarnings = hasWorkedDates
        ? autoEarnings.filter((e) => e.type !== "AUCTION")
        : autoEarnings;

      const preRoutingEarnings = [
        basicPayEarning,
        ...(otHourEarning ? [otHourEarning] : []),
        ...(otMinuteEarning ? [otMinuteEarning] : []),
        ...(autoAuctionEarning ? [autoAuctionEarning] : []),
        ...extraEarnings,
      ];

      const routed = applyDeclarationRouting(
        snapshot.declaration_status_snapshot,
        preRoutingEarnings.map((e) => ({ type: e.type, amount: e.amount, remarks: e.remarks ?? null })),
        input.deductions.map((d) => ({ type: d.type, amount: d.amount, remarks: d.remarks ?? null })),
      );

      // Preserve quantity/rate on auto-built rows by merging back by type
      const routedEarnings = routed.earnings.map((e) => {
        const original = preRoutingEarnings.find((o) => o.type === e.type && o.amount === e.amount);
        return {
          type: e.type,
          amount: e.amount,
          quantity: original?.quantity ?? null,
          rate: original?.rate ?? null,
          remarks: e.remarks ?? null,
        };
      });

      const { gross_pay, total_deductions, net_pay } = computeEntryTotals(
        routedEarnings,
        routed.deductions,
      );

      const existing = await prisma.payroll_entries.findFirst({
        where: {
          payroll_period_id: input.payroll_period_id,
          employee_id: input.employee_id,
          deleted_at: null,
        },
      });

      const entryData = {
        salary_type_snapshot: snapshot.salary_type_snapshot as salary_type,
        worker_type_snapshot: snapshot.worker_type_snapshot as worker_type,
        declaration_status_snapshot: snapshot.declaration_status_snapshot as declaration_status,
        name_snapshot: snapshot.name_snapshot,
        position_snapshot: snapshot.position_snapshot,
        daily_rate_snapshot: snapshot.daily_rate_snapshot,
        monthly_salary_snapshot: snapshot.monthly_salary_snapshot,
        auction_rate_snapshot: snapshot.auction_rate_snapshot,
        sss_snapshot: snapshot.sss_snapshot,
        philhealth_snapshot: snapshot.philhealth_snapshot,
        pagibig_snapshot: snapshot.pagibig_snapshot,
        tin_snapshot: snapshot.tin_snapshot,
        ot_hour_rate_snapshot: otHourRate,
        ot_minute_rate_snapshot: otMinuteRate,
        ot_rate_is_manual: input.ot_rate_is_manual,
        days_worked: derivedDaysWorked,
        days_leave_paid: derivedLeaveDays,
        ot_hours: input.ot_hours,
        ot_minutes: input.ot_minutes,
        worked_dates: hasWorkedDates ? (workedDates as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        basic_pay: basicPay,
        gross_pay,
        total_deductions,
        net_pay,
        remarks: input.remarks ?? null,
      };

      const earningsCreate = routedEarnings.map((e) => ({
        type: e.type as payroll_earning_type,
        amount: e.amount,
        quantity: e.quantity,
        rate: e.rate,
        remarks: e.remarks ?? null,
      }));
      const deductionsCreate = routed.deductions.map((d) => ({
        type: d.type as payroll_deduction_type,
        amount: d.amount,
        remarks: d.remarks ?? null,
      }));

      if (existing) {
        await prisma.$transaction(async (tx) => {
          await tx.payroll_earnings.deleteMany({ where: { payroll_entry_id: existing.payroll_entry_id } });
          await tx.payroll_deductions.deleteMany({ where: { payroll_entry_id: existing.payroll_entry_id } });
          await tx.payroll_entries.update({
            where: { payroll_entry_id: existing.payroll_entry_id },
            data: {
              ...entryData,
              earnings: { create: earningsCreate },
              deductions: { create: deductionsCreate },
            },
          });
        });
        return getEntry(existing.payroll_entry_id);
      }

      const created = await prisma.payroll_entries.create({
        data: {
          payroll_period_id: input.payroll_period_id,
          employee_id: input.employee_id,
          ...entryData,
          earnings: { create: earningsCreate },
          deductions: { create: deductionsCreate },
        },
        include: ENTRY_INCLUDE,
      });

      return created;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error saving payroll entry!", { cause: error.message });
      }
      throw error;
    }
  },

  deleteEntry: async (payroll_entry_id) => {
    try {
      const entry = await prisma.payroll_entries.findFirst({
        where: { payroll_entry_id, deleted_at: null },
        include: { period: true },
      });
      if (!entry) throw new NotFoundError("Payroll entry not found!");
      if (entry.period.status !== "DRAFT") {
        throw new DatabaseOperationError("Cannot delete entries from a non-DRAFT period.");
      }
      await prisma.payroll_entries.update({
        where: { payroll_entry_id },
        data: { deleted_at: new Date() },
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseOperationError) throw error;
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error deleting payroll entry!", { cause: error.message });
      }
      throw error;
    }
  },

  bulkGenerateEntries: async (payroll_period_id, branch_id) => {
    try {
      const period = await prisma.payroll_periods.findFirstOrThrow({
        where: { payroll_period_id, deleted_at: null },
      });
      if (period.status !== "DRAFT") {
        throw new DatabaseOperationError("Can only generate entries for DRAFT periods.");
      }

      const employees = await prisma.employees.findMany({
        where: { branch_id, status: "ACTIVE", deleted_at: null },
        orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
      });

      const existingEmployeeIds = await prisma.payroll_entries.findMany({
        where: { payroll_period_id, deleted_at: null },
        select: { employee_id: true },
      }).then((rows) => new Set(rows.map((r) => r.employee_id)));

      const toCreate = employees.filter((e) => !existingEmployeeIds.has(e.employee_id));

      if (toCreate.length === 0) return [];

      await prisma.payroll_entries.createMany({
        data: toCreate.map((emp) => {
          const snapshot = buildEmployeeSnapshot(emp);
          return {
            payroll_period_id,
            employee_id: emp.employee_id,
            name_snapshot: snapshot.name_snapshot,
            position_snapshot: snapshot.position_snapshot,
            salary_type_snapshot: snapshot.salary_type_snapshot as salary_type,
            worker_type_snapshot: snapshot.worker_type_snapshot as worker_type,
            declaration_status_snapshot: snapshot.declaration_status_snapshot as declaration_status,
            daily_rate_snapshot: snapshot.daily_rate_snapshot,
            monthly_salary_snapshot: snapshot.monthly_salary_snapshot,
            auction_rate_snapshot: snapshot.auction_rate_snapshot,
            ot_hour_rate_snapshot: snapshot.ot_hour_rate_snapshot,
            ot_minute_rate_snapshot: snapshot.ot_minute_rate_snapshot,
            ot_rate_is_manual: snapshot.ot_rate_is_manual,
            sss_snapshot: snapshot.sss_snapshot,
            philhealth_snapshot: snapshot.philhealth_snapshot,
            pagibig_snapshot: snapshot.pagibig_snapshot,
            tin_snapshot: snapshot.tin_snapshot,
            days_worked: 0,
            days_leave_paid: 0,
            ot_hours: 0,
            ot_minutes: 0,
            basic_pay: 0,
            gross_pay: 0,
            total_deductions: 0,
            net_pay: 0,
          };
        }),
      });

      return prisma.payroll_entries.findMany({
        where: { payroll_period_id, deleted_at: null },
        include: ENTRY_INCLUDE,
        orderBy: { name_snapshot: "asc" },
      });
    } catch (error) {
      if (error instanceof DatabaseOperationError) throw error;
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error generating payroll entries!", { cause: error.message });
      }
      throw error;
    }
  },

  bulkUpsertFromUpload: async (payroll_period_id, rows) => {
    try {
      const results: PayrollEntryFullRow[] = [];
      for (const row of rows) {
        const input: UpsertPayrollEntryInput = {
          payroll_period_id,
          employee_id: row.employee_id,
          days_worked: row.days_worked ?? 0,
          days_leave_paid: row.days_leave_paid ?? 0,
          ot_hours: row.ot_hours ?? 0,
          ot_minutes: row.ot_minutes ?? 0,
          ot_rate_is_manual: false,
          ot_hour_rate_snapshot: null,
          ot_minute_rate_snapshot: null,
          worked_dates: row.worked_dates ?? null,
          remarks: row.remarks ?? null,
          earnings: row.earnings,
          deductions: row.deductions,
        };
        const entry = await PayrollEntryRepository.upsertEntry(input);
        results.push(entry);
      }
      return results;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error bulk-upserting payroll entries!", { cause: error.message });
      }
      throw error;
    }
  },

  markEntryPaid: async (payroll_entry_id, expenseData) => {
    try {
      const entry = await prisma.payroll_entries.findFirst({
        where: { payroll_entry_id, deleted_at: null },
        include: { period: true },
      });
      if (!entry) throw new NotFoundError("Payroll entry not found!");
      if (entry.expense_id) throw new DatabaseOperationError("Entry is already paid.");

      const expense = await prisma.$transaction(async (tx) => {
        const createdExpense = await tx.expenses.create({
          data: {
            amount: entry.net_pay,
            purpose: "SALARY",
            remarks: expenseData.remarks,
            branch_id: expenseData.branch_id,
            employee_id: entry.employee_id,
            created_at: expenseData.created_at,
          },
        });
        await tx.payroll_entries.update({
          where: { payroll_entry_id },
          data: { expense_id: createdExpense.expense_id },
        });
        return createdExpense;
      });

      void expense;
      return getEntry(payroll_entry_id);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseOperationError) throw error;
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error marking entry as paid!", { cause: error.message });
      }
      throw error;
    }
  },
};
