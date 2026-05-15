import { PayrollEntryRepository } from "src/infrastructure/di/repositories";

export const getPayrollEntryUseCase = (payroll_entry_id: string) =>
  PayrollEntryRepository.getEntry(payroll_entry_id);
