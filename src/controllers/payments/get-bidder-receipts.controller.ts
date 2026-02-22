import { logger } from "@/app/lib/logger";
import { getBidderReceiptsUseCase } from "src/application/use-cases/payments/get-bidder-receipts.use-case";
import { DatabaseOperationError } from "src/entities/errors/common";
import { ReceiptRecordWithDetailsRow } from "src/entities/models/Payment";
import { err, ok } from "src/entities/models/Result";
import { formatDate } from "@/app/lib/utils";

function presenter(
  receipts: Omit<
    ReceiptRecordWithDetailsRow,
    "auctions_inventories" | "inventory_histories"
  >[],
) {
  return receipts.map((receipt) => ({
    receipt_id: receipt.receipt_id,
    receipt_number: receipt.receipt_number,
    auction_bidder_id: receipt.auction_bidder_id,
    total_amount_paid: receipt.payments.reduce(
      (acc, item) => (acc += item.amount_paid),
      0,
    ),
    purpose: receipt.purpose,
    auction_date: formatDate(
      receipt.auction_bidder.created_at,
      "MMMM dd, yyyy",
    ),
    created_at: formatDate(receipt.created_at, "MMMM dd, yyyy HH:mm:ss a"),
  }));
}

export const GetBidderReceiptsController = async (
  auction_bidder_id: string,
) => {
  try {
    const receipts = await getBidderReceiptsUseCase(auction_bidder_id);
    return ok(presenter(receipts));
  } catch (error) {
    logger("GetBidderReceiptsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
