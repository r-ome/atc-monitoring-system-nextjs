import { PayrollEntryRepository } from "src/infrastructure/di/repositories";

export const deletePayrollEntryUseCase = (payroll_entry_id: string) =>
  PayrollEntryRepository.deleteEntry(payroll_entry_id);
