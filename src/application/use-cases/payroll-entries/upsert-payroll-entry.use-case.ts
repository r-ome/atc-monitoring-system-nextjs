import { PayrollEntryRepository } from "src/infrastructure/di/repositories";
import type { UpsertPayrollEntryInput } from "src/entities/models/PayrollEntry";

export const upsertPayrollEntryUseCase = (input: UpsertPayrollEntryInput) =>
  PayrollEntryRepository.upsertEntry(input);
