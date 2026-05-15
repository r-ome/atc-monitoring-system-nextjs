import { PayrollEntryRepository } from "src/infrastructure/di/repositories";

export const bulkGenerateEntriesUseCase = (payroll_period_id: string, branch_id: string) =>
  PayrollEntryRepository.bulkGenerateEntries(payroll_period_id, branch_id);
