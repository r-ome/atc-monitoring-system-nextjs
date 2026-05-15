import prisma from "@/app/lib/prisma/prisma";
import { NotFoundError, DatabaseOperationError } from "src/entities/errors/common";
import { PayrollEntryRepository } from "src/infrastructure/di/repositories";
import type { BulkUpsertUploadRow } from "src/application/repositories/payroll-entries.repository.interface";

export async function confirmRegularUploadUseCase(
  payroll_period_id: string,
  rows: BulkUpsertUploadRow[],
) {
  const period = await prisma.payroll_periods.findFirst({
    where: { payroll_period_id, deleted_at: null },
  });
  if (!period) throw new NotFoundError("Payroll period not found!");
  if (period.status !== "DRAFT") {
    throw new DatabaseOperationError("Can only apply uploads to DRAFT periods.");
  }
  return PayrollEntryRepository.bulkUpsertFromUpload(payroll_period_id, rows);
}
