import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import {
  AuctionSalesSummaryRow,
  FilterMode,
} from "src/entities/models/Report";
import { formatDate } from "@/app/lib/utils";
import { endOfWeek, max, min, startOfWeek } from "date-fns";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

function getWeekBucket(date: Date) {
  const year = Number(formatDate(date, "yyyy"));
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const weekStart = max([startOfWeek(date, { weekStartsOn: 0 }), yearStart]);
  const weekEnd = min([endOfWeek(date, { weekStartsOn: 0 }), yearEnd]);
  const startLabel = formatDate(weekStart, "MMM d");
  const endLabel = formatDate(weekEnd, "MMM d");

  return {
    key: formatDate(weekStart, "yyyy-MM-dd"),
    label: `${startLabel} - ${endLabel}`,
  };
}

type SalesRow = {
  key: string;
  label: string;
  total_sales: number;
  total_registration_fee: number;
  total_bidder_percentage_amount: number;
};

function dailyPresenter(auctions: AuctionSalesSummaryRow[]): SalesRow[] {
  return auctions.map((auction) => {
    return {
      key: auction.auction_id,
      label: formatDate(auction.created_at, "MMM dd, yyyy"),
      total_sales: auction.total_sales,
      total_registration_fee: auction.total_registration_fee,
      total_bidder_percentage_amount: auction.total_bidder_percentage_amount,
    };
  });
}

function monthlyPresenter(auctions: AuctionSalesSummaryRow[]): SalesRow[] {
  const monthBuckets = MONTHS.map(() => ({
    total_sales: 0,
    total_registration_fee: 0,
    total_bidder_percentage_amount: 0,
  }));

  for (const auction of auctions) {
    const monthIndex = auction.created_at.getMonth();
    monthBuckets[monthIndex].total_sales += auction.total_sales;
    monthBuckets[monthIndex].total_registration_fee +=
      auction.total_registration_fee;
    monthBuckets[monthIndex].total_bidder_percentage_amount +=
      auction.total_bidder_percentage_amount;
  }

  return monthBuckets
    .map((bucket, i) => ({
      key: MONTHS[i],
      label: MONTHS[i],
      ...bucket,
    }))
    .filter(
      (row) =>
        row.total_sales > 0 ||
        row.total_registration_fee > 0 ||
        row.total_bidder_percentage_amount > 0,
    );
}

function weeklyPresenter(auctions: AuctionSalesSummaryRow[]): SalesRow[] {
  const weekBuckets = new Map<string, SalesRow>();

  for (const auction of auctions) {
    const { key, label } = getWeekBucket(auction.created_at);
    const existing = weekBuckets.get(key) ?? {
      key,
      label,
      total_sales: 0,
      total_registration_fee: 0,
      total_bidder_percentage_amount: 0,
    };

    existing.total_sales += auction.total_sales;
    existing.total_registration_fee +=
      auction.total_registration_fee;
    existing.total_bidder_percentage_amount +=
      auction.total_bidder_percentage_amount;
    weekBuckets.set(key, existing);
  }

  return Array.from(weekBuckets.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .filter(
      (row) =>
        row.total_sales > 0 ||
        row.total_registration_fee > 0 ||
        row.total_bidder_percentage_amount > 0,
    );
}

export function presentTotalSales(
  auctions: AuctionSalesSummaryRow[],
  mode: FilterMode,
): SalesRow[] {
  if (mode === "monthly") return monthlyPresenter(auctions);
  if (mode === "weekly") return weeklyPresenter(auctions);
  return dailyPresenter(auctions);
}

export const GetTotalSalesController = async (
  branch_id: string,
  date: string,
  mode: FilterMode,
) => {
  try {
    const auctions = await ReportsRepository.getTotalSales(branch_id, date);
    const rows = presentTotalSales(auctions, mode);
    return ok(rows);
  } catch (error) {
    logger("GetTotalSalesController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
