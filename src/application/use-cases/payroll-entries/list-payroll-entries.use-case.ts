import { PayrollEntryRepository } from "src/infrastructure/di/repositories";

export const listPayrollEntriesUseCase = (payroll_period_id: string) =>
  PayrollEntryRepository.getEntriesForPeriod(payroll_period_id);
