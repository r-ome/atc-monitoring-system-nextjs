import { IPayrollPeriodRepository } from "src/application/repositories/payroll-periods.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { NotFoundError, DatabaseOperationError } from "src/entities/errors/common";
import { isPrismaError, isPrismaValidationError } from "@/app/lib/error-handler";
import type { CreatePayrollPeriodInput } from "src/entities/models/PayrollPeriod";
import { fromZonedTime } from "date-fns-tz";

const TZ = "Asia/Manila";

function formatNumberToCurrency(n: number): string {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const PayrollPeriodRepository: IPayrollPeriodRepository = {
  getPeriods: async (branch_id?) => {
    try {
      return await (prisma.payroll_periods.findMany({
        where: { ...(branch_id ? { branch_id } : {}), deleted_at: null },
        include: { _count: { select: { entries: { where: { deleted_at: null } } } } },
        orderBy: { period_end: "desc" },
      }) as unknown as ReturnType<IPayrollPeriodRepository["getPeriods"]>);
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting payroll periods!", { cause: error.message });
      }
      throw error;
    }
  },

  getPeriod: async (payroll_period_id) => {
    try {
      const period = await prisma.payroll_periods.findFirst({
        where: { payroll_period_id, deleted_at: null },
      });
      if (!period) throw new NotFoundError("Payroll period not found!");
      return period;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting payroll period!", { cause: error.message });
      }
      throw error;
    }
  },

  createPeriod: async (data: CreatePayrollPeriodInput) => {
    try {
      return await prisma.payroll_periods.create({
        data: {
          branch_id: data.branch_id,
          label: data.label,
          period_start: new Date(data.period_start),
          period_end: new Date(data.period_end),
          pay_date: data.pay_date ? new Date(data.pay_date) : null,
          remarks: data.remarks ?? null,
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating payroll period!", { cause: error.message });
      }
      throw error;
    }
  },

  postPeriod: async (payroll_period_id, posted_by) => {
    try {
      const period = await prisma.payroll_periods.findFirst({
        where: { payroll_period_id, deleted_at: null },
      });
      if (!period) throw new NotFoundError("Payroll period not found!");
      if (period.status !== "DRAFT") throw new DatabaseOperationError("Only DRAFT periods can be posted.");

      // Lock the period AND emit one expense row per entry, all in one
      // transaction so a partial failure doesn't leave the period
      // half-paid.
      const entries = await prisma.payroll_entries.findMany({
        where: { payroll_period_id, deleted_at: null, expense_id: null },
      });
      const paidAt = period.pay_date ?? new Date();

      // Petty cash guard: refuse to post if the branch's running balance
      // as of the pay date can't cover the total net pay we're about to
      // emit as SALARY expenses.
      const totalNetPay = entries.reduce((s, e) => s + e.net_pay.toNumber(), 0);
      if (totalNetPay > 0) {
        const dateStr = paidAt.toISOString().slice(0, 10);
        const endOfDay = fromZonedTime(`${dateStr} 23:59:59.999`, TZ);
        const pettyCash = await prisma.petty_cash.findFirst({
          where: { branch_id: period.branch_id, created_at: { lte: endOfDay } },
          orderBy: { created_at: "desc" },
        });
        const balance = pettyCash?.amount.toNumber() ?? 0;
        if (balance < totalNetPay) {
          throw new DatabaseOperationError(
            `Petty cash balance ${formatNumberToCurrency(balance)} on ${dateStr} is not enough to cover total payroll ${formatNumberToCurrency(totalNetPay)}.`,
          );
        }
      }

      const updated = await prisma.$transaction(async (tx) => {
        for (const entry of entries) {
          const expense = await tx.expenses.create({
            data: {
              amount: entry.net_pay,
              purpose: "SALARY",
              remarks: `Salary for ${entry.name_snapshot}`,
              branch_id: period.branch_id,
              employee_id: entry.employee_id,
              created_at: paidAt,
            },
          });
          await tx.payroll_entries.update({
            where: { payroll_entry_id: entry.payroll_entry_id },
            data: { expense_id: expense.expense_id },
          });
        }
        return tx.payroll_periods.update({
          where: { payroll_period_id },
          data: { status: "POSTED", posted_at: new Date(), posted_by },
        });
      });
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseOperationError) throw error;
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error posting payroll period!", { cause: error.message });
      }
      throw error;
    }
  },

  voidPeriod: async (payroll_period_id) => {
    try {
      const period = await prisma.payroll_periods.findFirst({
        where: { payroll_period_id, deleted_at: null },
      });
      if (!period) throw new NotFoundError("Payroll period not found!");
      return await prisma.payroll_periods.update({
        where: { payroll_period_id },
        data: { status: "VOID" },
      });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error voiding payroll period!", { cause: error.message });
      }
      throw error;
    }
  },
};
