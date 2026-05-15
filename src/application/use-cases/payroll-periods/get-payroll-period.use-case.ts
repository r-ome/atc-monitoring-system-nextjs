import { PayrollPeriodRepository } from "src/infrastructure/di/repositories";

export const getPayrollPeriodUseCase = (payroll_period_id: string) =>
  PayrollPeriodRepository.getPeriod(payroll_period_id);
