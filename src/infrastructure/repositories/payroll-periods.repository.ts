import { IPayrollPeriodRepository } from "src/application/repositories/payroll-periods.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { NotFoundError, DatabaseOperationError } from "src/entities/errors/common";
import { isPrismaError, isPrismaValidationError } from "@/app/lib/error-handler";
import type { CreatePayrollPeriodInput } from "src/entities/models/PayrollPeriod";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { cascadeFromDay } from "./expenses.repository";

const TZ = "Asia/Manila";

type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

function formatNumberToCurrency(n: number): string {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function getPettyCashIdForDay(
  tx: PrismaTransactionClient,
  branch_id: string,
  dateStr: string,
): Promise<string> {
  const startOfDay = fromZonedTime(`${dateStr} 00:00:00.000`, TZ);
  const endOfDay = fromZonedTime(`${dateStr} 23:59:59.999`, TZ);
  const pettyCash = await tx.petty_cash.findFirst({
    where: {
      branch_id,
      created_at: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { created_at: "desc" },
  });

  return pettyCash?.petty_cash_id ?? "CREATE";
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

      // Petty cash guard: refuse to post if the branch's latest running
      // balance can't cover the total net pay we're about to emit as
      // SALARY expenses.
      const totalNetPay = entries.reduce((s, e) => s + e.net_pay.toNumber(), 0);
      const dateStr = formatInTimeZone(paidAt, TZ, "yyyy-MM-dd");
      if (totalNetPay > 0) {
        const pettyCash = await prisma.petty_cash.findFirst({
          where: { branch_id: period.branch_id },
          orderBy: { created_at: "desc" },
        });
        const balance = pettyCash?.amount.toNumber() ?? 0;
        if (balance < totalNetPay) {
          throw new DatabaseOperationError(
            `Current petty cash balance ${formatNumberToCurrency(balance)} is not enough to cover total payroll ${formatNumberToCurrency(totalNetPay)}.`,
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
        if (totalNetPay > 0) {
          const pettyCashId = await getPettyCashIdForDay(tx, period.branch_id, dateStr);
          await cascadeFromDay(tx, dateStr, pettyCashId, period.branch_id);
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
