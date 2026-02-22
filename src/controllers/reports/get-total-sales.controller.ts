import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { getTotalSalesUseCase } from "src/application/use-cases/reports/get-total-sales.use-case";
import { AuctionWithSalesRow } from "src/entities/models/Auction";
import { formatDate } from "@/app/lib/utils";

function presenter(auctions: AuctionWithSalesRow[]) {
  return auctions.map((auction) => {
    const total_items = auction.registered_bidders.flatMap(
      (registered_bidder) => registered_bidder.auctions_inventories,
    );

    const total_sales = total_items
      .filter((auction_inventory) =>
        ["PAID"].includes(auction_inventory.status),
      )
      .reduce((acc, auction_inventory) => {
        acc += auction_inventory.price;
        return acc;
      }, 0);

    const total_registration_fee = auction.registered_bidders.reduce(
      (acc, registered_bidder) => {
        acc += registered_bidder.registration_fee;
        return acc;
      },
      0,
    );

    return {
      auction_id: auction.auction_id,
      auction_date: formatDate(auction.created_at, "MMM dd, yyyy"),
      total_bidders: auction.registered_bidders.length,
      total_registration_fee,
      total_items: total_items.length,
      total_sales,
    };
  });
}

export const GetTotalSalesController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const total_sales = await getTotalSalesUseCase(branch_id, date);
    return ok(presenter(total_sales));
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
