import type {
  CreatePayrollPeriodInput,
  PayrollPeriodRow,
  PayrollPeriodWithCountsRow,
} from "src/entities/models/PayrollPeriod";

export interface IPayrollPeriodRepository {
  getPeriods(branch_id?: string): Promise<(PayrollPeriodWithCountsRow & { _sum: { net_pay: { toNumber: () => number } | null } })[]>;
  getPeriod(payroll_period_id: string): Promise<PayrollPeriodRow>;
  createPeriod(data: CreatePayrollPeriodInput): Promise<PayrollPeriodRow>;
  postPeriod(payroll_period_id: string, posted_by: string): Promise<PayrollPeriodRow>;
  voidPeriod(payroll_period_id: string): Promise<PayrollPeriodRow>;
}
