import { PayrollEntryRepository } from "src/infrastructure/di/repositories";

export const markEntryPaidUseCase = (
  payroll_entry_id: string,
  expense: { branch_id: string; remarks: string; created_at: Date },
) => PayrollEntryRepository.markEntryPaid(payroll_entry_id, expense);
