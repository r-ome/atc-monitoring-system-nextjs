import { getPaymentsByDateUseCase } from "src/application/use-cases/payments/get-payments-by-date.use-case";
import { DatabaseOperationError } from "src/entities/errors/common";
import { PaymentSchema } from "src/entities/models/Payment";
import { err, ok } from "src/entities/models/Response";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

function presenter(payments: PaymentSchema[]) {
  return payments.map((payment) => ({
    payment_id: payment.payment_id,
    receipt_id: payment.receipt_id,
    amount_paid: payment.amount_paid,
    payment_type: payment.payment_type,
    auction_date: formatDate(
      payment.receipt.auction_bidder.created_at,
      "yyyy-MM-dd"
    ),
    created_at: formatDate(payment.created_at, "MMMM dd, yyyy hh:mm a"),
    receipt: {
      receipt_id: payment.receipt.receipt_id,
      receipt_number: payment.receipt.receipt_number,
      purpose: payment.receipt.purpose,
    },
    bidder: {
      bidder_id: payment.receipt.auction_bidder.bidder_id,
      bidder_number: payment.receipt.auction_bidder.bidder.bidder_number,
      full_name: `${payment.receipt.auction_bidder.bidder.first_name} ${payment.receipt.auction_bidder.bidder.last_name}`,
    },
  }));
}

export const GetPaymentsByDateController = async (date: Date) => {
  try {
    const payments = await getPaymentsByDateUseCase(date);
    return ok(presenter(payments));
  } catch (error) {
    logger("GetPaymentsByDateController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
