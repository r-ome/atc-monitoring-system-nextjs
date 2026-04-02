import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import {
  AuctionSalesSummaryRow,
  FilterMode,
} from "src/entities/models/Report";
import { formatDate } from "@/app/lib/utils";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

type SalesRow = {
  key: string;
  label: string;
  total_bidders: number;
  total_items: number;
  total_sales: number;
  total_registration_fee: number;
};

function dailyPresenter(auctions: AuctionSalesSummaryRow[]): SalesRow[] {
  return auctions.map((auction) => {
    return {
      key: auction.auction_id,
      label: formatDate(auction.created_at, "MMM dd, yyyy"),
      total_bidders: auction.total_bidders,
      total_items: auction.total_items,
      total_sales: auction.total_sales,
      total_registration_fee: auction.total_registration_fee,
    };
  });
}

function monthlyPresenter(auctions: AuctionSalesSummaryRow[]): SalesRow[] {
  const monthBuckets = MONTHS.map(() => ({
    total_bidders: 0,
    total_items: 0,
    total_sales: 0,
    total_registration_fee: 0,
  }));

  for (const auction of auctions) {
    const monthIndex = auction.created_at.getMonth();
    monthBuckets[monthIndex].total_bidders += auction.total_bidders;
    monthBuckets[monthIndex].total_items += auction.total_items;
    monthBuckets[monthIndex].total_sales += auction.total_sales;
    monthBuckets[monthIndex].total_registration_fee +=
      auction.total_registration_fee;
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
        row.total_bidders > 0 ||
        row.total_items > 0 ||
        row.total_registration_fee > 0,
    );
}

export function presentTotalSales(
  auctions: AuctionSalesSummaryRow[],
  mode: FilterMode,
): SalesRow[] {
  return mode === "monthly" ? monthlyPresenter(auctions) : dailyPresenter(auctions);
}

export const GetTotalSalesController = async (
  branch_id: string,
  date: string,
  mode: FilterMode,
) => {
  try {
    const auctions = await ReportsRepository.getTotalSales(branch_id, date);
    const rows =
      mode === "monthly"
        ? monthlyPresenter(auctions)
        : dailyPresenter(auctions);
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
