import prisma from "@/app/lib/prisma/prisma";
import { NotFoundError } from "src/entities/errors/common";
import {
  validateRegularUpload,
  type RegularUploadResult,
  type RegularUploadRowInput,
} from "src/application/payroll/upload-regular-pipeline";
import { getAuctionDatesForPeriod } from "src/application/payroll/auction-days";

export type PreviewRegularUploadOutput = {
  payroll_period_id: string;
  period_start: string;
  period_end: string;
  auction_dates: string[];
  rows: RegularUploadResult[];
};

export async function previewRegularUploadUseCase(
  payroll_period_id: string,
  rows: RegularUploadRowInput[],
): Promise<PreviewRegularUploadOutput> {
  const period = await prisma.payroll_periods.findFirst({
    where: { payroll_period_id, deleted_at: null },
  });
  if (!period) throw new NotFoundError("Payroll period not found!");

  const employees = await prisma.employees.findMany({
    where: { branch_id: period.branch_id, deleted_at: null },
  });

  const auction_dates = await getAuctionDatesForPeriod(
    period.branch_id,
    period.period_start,
    period.period_end,
  );

  const results = validateRegularUpload({
    rows,
    employees,
    period: { period_start: period.period_start, period_end: period.period_end },
    auctionDatesIso: auction_dates,
  });

  return {
    payroll_period_id,
    period_start: period.period_start.toISOString().split("T")[0],
    period_end: period.period_end.toISOString().split("T")[0],
    auction_dates,
    rows: results,
  };
}
