import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Response";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { UnpaidAuctionsBiddersSchema } from "src/entities/models/Bidder";
import { getUnpaidBiddersUseCase } from "src/application/use-cases/statistics/get-unpaid-bidders.use-case";

function presenter(bidders: UnpaidAuctionsBiddersSchema[]) {
  console.log(bidders);
  const date_format = "MMM d, yyyy";
  return bidders.map((bidder) => ({
    bidder_id: bidder.bidder_id,
    bidder_number: bidder.bidder.bidder_number,
    first_name: bidder.bidder.first_name,
    last_name: bidder.bidder.last_name,
    auction_date: formatDate(bidder.created_at, date_format),
    balance: bidder.balance,
    items: bidder.auctions_inventories.filter(
      (item) => item.status === "UNPAID"
    ).length,
    // container_id: container.container_id,
    // barcode: container.barcode,
    // bill_of_lading_number: container.bill_of_lading_number ?? "",
    // container_number: container.container_number ?? "",
    // arrival_date: container.arrival_date
    //   ? formatDate(new Date(container.arrival_date), date_format)
    //   : "N/A",
    // due_date: container.due_date
    //   ? formatDate(new Date(container.due_date), date_format)
    //   : "N/A",
  }));
}

export const GetUnpaidBiddersController = async () => {
  try {
    const unpaid_bidders = await getUnpaidBiddersUseCase();
    return ok(presenter(unpaid_bidders));
  } catch (error) {
    logger("GetUnpaidBiddersController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
