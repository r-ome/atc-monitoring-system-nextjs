import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import {
  AuctionKpiEntry,
  AuctionKpiRow,
} from "src/entities/models/Report";
import { formatDate } from "@/app/lib/utils";

export function presentAuctionKpis(rows: AuctionKpiRow[]): AuctionKpiEntry[] {
  return rows.map((row) => ({
    auction_id: row.auction_id,
    auction_date: formatDate(row.auction_date, "MMM dd"),
    total_sales: row.total_sales,
    items_sold: row.items_sold,
    registered_bidders: row.registered_bidders,
    total_registration_fee: row.total_registration_fee,
    highest_item_sold: row.highest_item_sold,
    avg_selling_price:
      row.items_sold > 0 ? Math.round(row.total_sales / row.items_sold) : 0,
  }));
}

export const GetAuctionKpisController = async (
  branch_id: string,
  year: string,
) => {
  try {
    const rows = await ReportsRepository.getAuctionKpis(branch_id, year);
    return ok(presentAuctionKpis(rows));
  } catch (error) {
    logger("GetAuctionKpisController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Failed to load auction KPIs", cause: error.message });
    }
    return err({ message: "Failed to load auction KPIs", cause: "Server Error" });
  }
};
