import prisma from "@/app/lib/prisma/prisma";
import { logger } from "@/app/lib/logger";
import { ok, err } from "src/entities/models/Result";
import { getAuctionDatesForPeriod } from "src/application/payroll/auction-days";

export const GetAuctionDatesForPeriodController = async (payroll_period_id: string) => {
  try {
    const period = await prisma.payroll_periods.findFirst({
      where: { payroll_period_id, deleted_at: null },
    });
    if (!period) return err({ message: "Payroll period not found" });
    const dates = await getAuctionDatesForPeriod(
      period.branch_id,
      period.period_start,
      period.period_end,
    );
    return ok({
      period_start: period.period_start.toISOString().split("T")[0],
      period_end: period.period_end.toISOString().split("T")[0],
      auction_dates: dates,
    });
  } catch (error) {
    logger("GetAuctionDatesForPeriodController", error);
    return err({ message: "Server Error", cause: "Failed to load auction dates" });
  }
};
