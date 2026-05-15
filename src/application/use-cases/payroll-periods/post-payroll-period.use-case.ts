import { PayrollPeriodRepository } from "src/infrastructure/di/repositories";

export const postPayrollPeriodUseCase = (payroll_period_id: string, posted_by: string) =>
  PayrollPeriodRepository.postPeriod(payroll_period_id, posted_by);
