import { PayrollPeriodRepository } from "src/infrastructure/di/repositories";

export const listPayrollPeriodsUseCase = (branch_id?: string) =>
  PayrollPeriodRepository.getPeriods(branch_id);
