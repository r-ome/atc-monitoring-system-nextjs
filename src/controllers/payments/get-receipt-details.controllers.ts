import { getReceiptDetailsUseCase } from "src/application/use-cases/payments/get-receipt-details.use-case";
import { ReceiptRecordsSchema } from "src/entities/models/Payment";
import { ok, err } from "src/entities/models/Response";
import { format } from "date-fns";
import { DatabaseOperationError } from "src/entities/errors/common";

function presenter(
  receipt: Omit<ReceiptRecordsSchema, "auctions_inventories">
) {
  const date_format = "MMMM dd, yyyy hh:mm:ss a";
  return {
    receipt_id: receipt.receipt_id,
    receipt_number: receipt.receipt_number,
    auction_bidder_id: receipt.auction_bidder_id,
    purpose: receipt.purpose,
    total_amount_paid: receipt.payments.reduce(
      (acc, item) => (acc += item.amount_paid),
      0
    ),
    created_at: format(receipt.created_at, date_format),
    bidder: {
      bidder_id: receipt.auction_bidder.bidder.bidder_id,
      bidder_number: receipt.auction_bidder.bidder.bidder_number,
      full_name: `${receipt.auction_bidder.bidder.first_name} ${receipt.auction_bidder.bidder.last_name}`,
    },
    auctions_inventories: receipt.inventory_histories?.map((item) => ({
      auction_inventory_id: item.auction_inventory_id,
      barcode: item.auction_inventory?.inventory.barcode,
      control: item.auction_inventory?.inventory.control,
      description: item.auction_inventory?.description,
      qty: item.auction_inventory?.qty,
      price: item.auction_inventory?.price,
      manifest_number: item.auction_inventory?.manifest_number,
    })),
    payments: receipt.payments.map((payment) => ({
      payment_id: payment.payment_id,
      payment_type: payment.payment_type,
      amount_paid: payment.amount_paid,
      created_at: format(payment.created_at, date_format),
    })),
  };
}

export const GetReceiptDetailsController = async (
  auction_id: string,
  receipt_number: string
) => {
  try {
    const receipt = await getReceiptDetailsUseCase(auction_id, receipt_number);
    return ok(presenter(receipt));
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
