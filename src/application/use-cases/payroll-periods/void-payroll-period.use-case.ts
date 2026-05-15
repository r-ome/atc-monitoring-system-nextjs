import { PayrollPeriodRepository } from "src/infrastructure/di/repositories";

export const voidPayrollPeriodUseCase = (payroll_period_id: string) =>
  PayrollPeriodRepository.voidPeriod(payroll_period_id);
