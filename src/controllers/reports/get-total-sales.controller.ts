import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { AuctionWithSalesRow } from "src/entities/models/Auction";
import { FilterMode } from "src/entities/models/Report";
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

function computeAuction(auction: AuctionWithSalesRow) {
  const items = auction.registered_bidders.flatMap(
    (rb) => rb.auctions_inventories,
  );
  const sales = items
    .filter((ai) => ai.status === "PAID")
    .reduce((sum, ai) => sum + ai.price, 0);
  const registrationFee = auction.registered_bidders.reduce(
    (sum, rb) => sum + rb.registration_fee,
    0,
  );
  return {
    total_items: items.length,
    total_sales: sales,
    total_registration_fee: registrationFee,
    total_bidders: auction.registered_bidders.length,
  };
}

function dailyPresenter(auctions: AuctionWithSalesRow[]): SalesRow[] {
  return auctions.map((auction) => {
    const computed = computeAuction(auction);
    return {
      key: auction.auction_id,
      label: formatDate(auction.created_at, "MMM dd, yyyy"),
      ...computed,
    };
  });
}

function monthlyPresenter(auctions: AuctionWithSalesRow[]): SalesRow[] {
  const monthBuckets = MONTHS.map(() => ({
    total_bidders: 0,
    total_items: 0,
    total_sales: 0,
    total_registration_fee: 0,
  }));

  for (const auction of auctions) {
    const monthIndex = auction.created_at.getMonth();
    const computed = computeAuction(auction);
    monthBuckets[monthIndex].total_bidders += computed.total_bidders;
    monthBuckets[monthIndex].total_items += computed.total_items;
    monthBuckets[monthIndex].total_sales += computed.total_sales;
    monthBuckets[monthIndex].total_registration_fee += computed.total_registration_fee;
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

export function presentTotalSales(auctions: AuctionWithSalesRow[], mode: FilterMode): SalesRow[] {
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
