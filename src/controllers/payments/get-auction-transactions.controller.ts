import { getAuctionTransactionsUseCase } from "src/application/use-cases/payments/get-auction-transactions.use-case";
import { format } from "date-fns";
import { ReceiptRecordsSchema } from "src/entities/models/Payment";
import { ok, err } from "src/entities/models/Response";
import { DatabaseOperationError } from "src/entities/errors/common";

function presenter(
  transactions: Omit<
    ReceiptRecordsSchema,
    "auctions_inventories" | "inventory_histories"
  >[]
) {
  const date_format = "MMMM dd, yyyy hh:mm:ss a";
  return transactions.map((item) => ({
    receipt_id: item.receipt_id,
    receipt_number: item.receipt_number,
    auction_bidder_id: item.auction_bidder_id,
    purpose: item.purpose,
    created_at: format(item.created_at, date_format),
    total_amount_paid: item.payments.reduce(
      (acc, item) => (acc += item.amount_paid),
      0
    ),
    bidder: {
      bidder_id: item.auction_bidder.bidder.bidder_id,
      bidder_number: item.auction_bidder.bidder.bidder_number,
      full_name: `${item.auction_bidder.bidder.first_name} ${item.auction_bidder.bidder.last_name}`,
    },
    payments: item.payments.map((payment) => ({
      payment_id: payment.payment_id,
      payment_type: payment.payment_type,
      amount_paid: payment.amount_paid,
      created_at: format(payment.created_at, date_format),
    })),
  }));
}

export const GetAuctionTransactionsController = async (auction_id: string) => {
  try {
    const transactions = await getAuctionTransactionsUseCase(auction_id);
    return ok(presenter(transactions));
  } catch (error) {
    if (error instanceof DatabaseOperationError) {
      return err({
        message: "Server Error",
        cause: error.message,
      });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
