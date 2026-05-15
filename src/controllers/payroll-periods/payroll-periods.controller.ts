import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { DatabaseOperationError, InputParseError, NotFoundError } from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { formatDate } from "@/app/lib/utils";
import { createPayrollPeriodSchema } from "src/entities/models/PayrollPeriod";
import {
  listPayrollPeriodsUseCase,
  getPayrollPeriodUseCase,
  createPayrollPeriodUseCase,
  postPayrollPeriodUseCase,
  voidPayrollPeriodUseCase,
} from "src/application/use-cases/payroll-periods";

function presentPeriod(period: Awaited<ReturnType<typeof getPayrollPeriodUseCase>>, entryCount = 0, totalNetPay = 0) {
  return {
    payroll_period_id: period.payroll_period_id,
    branch_id: period.branch_id,
    label: period.label,
    period_start: formatDate(period.period_start, "MMM dd, yyyy"),
    period_end: formatDate(period.period_end, "MMM dd, yyyy"),
    pay_date: period.pay_date ? formatDate(period.pay_date, "MMM dd, yyyy") : null,
    status: period.status,
    posted_at: period.posted_at ? formatDate(period.posted_at, "MMM dd, yyyy hh:mm a") : null,
    posted_by: period.posted_by,
    remarks: period.remarks,
    entry_count: entryCount,
    total_net_pay: totalNetPay,
    created_at: formatDate(period.created_at, "MMM dd, yyyy"),
    updated_at: formatDate(period.updated_at, "MMM dd, yyyy"),
  };
}

export const ListPayrollPeriodsController = async (branch_id?: string) => {
  try {
    const periods = await listPayrollPeriodsUseCase(branch_id);
    return ok(
      periods.map((p) => {
        const raw = p as typeof p & { _count?: { entries: number }; _sum?: { net_pay?: { toNumber?: () => number } | null } };
        return presentPeriod(p, raw._count?.entries ?? 0, raw._sum?.net_pay?.toNumber?.() ?? 0);
      }),
    );
  } catch (error) {
    logger("ListPayrollPeriodsController", error);
    return err({ message: "Server Error", cause: "Failed to list payroll periods" });
  }
};

export const GetPayrollPeriodController = async (payroll_period_id: string) => {
  try {
    const period = await getPayrollPeriodUseCase(payroll_period_id);
    return ok(presentPeriod(period));
  } catch (error) {
    logger("GetPayrollPeriodController", error);
    if (error instanceof NotFoundError) return err({ message: error.message, cause: error.cause });
    return err({ message: "Server Error", cause: "Failed to get payroll period" });
  }
};

export const CreatePayrollPeriodController = async (input: Record<string, unknown>) => {
  const ctx = RequestContext.getStore();
  try {
    const { data, error: inputParseError } = createPayrollPeriodSchema.safeParse(input);
    if (inputParseError) {
      throw new InputParseError("Invalid Data!", { cause: inputParseError.flatten().fieldErrors });
    }
    const period = await createPayrollPeriodUseCase(data);
    logger("CreatePayrollPeriodController", { data, username: ctx?.username }, "info");
    await logActivity("CREATE", "payroll_period", period.payroll_period_id, `Created payroll period: ${period.label}`);
    return ok(presentPeriod(period));
  } catch (error) {
    if (error instanceof InputParseError) {
      return err({ message: error.message, cause: error.cause });
    }
    logger("CreatePayrollPeriodController", error);
    if (error instanceof DatabaseOperationError) return err({ message: "Server Error", cause: error.message });
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};

export const PostPayrollPeriodController = async (payroll_period_id: string) => {
  const ctx = RequestContext.getStore();
  try {
    const period = await postPayrollPeriodUseCase(payroll_period_id, ctx?.username ?? "system");
    logger("PostPayrollPeriodController", { payroll_period_id, username: ctx?.username }, "info");
    await logActivity("UPDATE", "payroll_period", payroll_period_id, `Posted payroll period: ${period.label}`);
    return ok(presentPeriod(period));
  } catch (error) {
    logger("PostPayrollPeriodController", error);
    if (error instanceof NotFoundError || error instanceof DatabaseOperationError) {
      return err({ message: error.message, cause: error.cause });
    }
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};

export const VoidPayrollPeriodController = async (payroll_period_id: string) => {
  const ctx = RequestContext.getStore();
  try {
    const period = await voidPayrollPeriodUseCase(payroll_period_id);
    logger("VoidPayrollPeriodController", { payroll_period_id, username: ctx?.username }, "info");
    await logActivity("UPDATE", "payroll_period", payroll_period_id, `Voided payroll period: ${period.label}`);
    return ok(presentPeriod(period));
  } catch (error) {
    logger("VoidPayrollPeriodController", error);
    if (error instanceof NotFoundError) return err({ message: error.message, cause: error.cause });
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};
