import { PaymentRepository } from "src/infrastructure/di/repositories";
import {
  ReceiptRecordWithHistoriesRow,
  ReceiptRecords,
} from "src/entities/models/Payment";
import { ok, err } from "src/entities/models/Result";
import { formatDate } from "@/app/lib/utils";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { parseInventoryHistoryRemark } from "src/entities/models/InventoryHistoryRemark";

function resolveLegacyPriceChangeFromHistoryRemark(
  remarks: string | null | undefined,
) {
  const parsed = parseInventoryHistoryRemark(remarks);
  if (
    typeof parsed.previous_price !== "number" ||
    typeof parsed.new_price !== "number"
  ) {
    return null;
  }

  return {
    previous_price: parsed.previous_price,
    new_price: parsed.new_price,
  };
}

function presenter(receipts: ReceiptRecordWithHistoriesRow[]): ReceiptRecords[] {
  const date_format = "MMMM dd, yyyy hh:mm:ss a";

  return receipts.map((receipt) => ({
    receipt_id: receipt.receipt_id,
    receipt_number: receipt.receipt_number,
    auction_bidder_id: receipt.auction_bidder_id,
    purpose: receipt.purpose,
    storage_fee: receipt.storage_fee,
    auction_date: formatDate(
      receipt.auction_bidder.created_at,
      "MMMM dd, yyyy",
    ),
    total_amount_paid: receipt.payments.reduce(
      (acc, payment) => acc + payment.amount_paid,
      0,
    ),
    remarks: receipt.remarks,
    bidder: {
      bidder_id: receipt.auction_bidder.bidder.bidder_id,
      bidder_number: receipt.auction_bidder.bidder.bidder_number,
      full_name: `${receipt.auction_bidder.bidder.first_name} ${receipt.auction_bidder.bidder.last_name}`,
      service_charge: receipt.auction_bidder.service_charge,
      registration_fee: receipt.auction_bidder.registration_fee,
      already_consumed: receipt.auction_bidder.already_consumed,
    },
    auctions_inventories: receipt.inventory_histories.map((history) => {
      const auction_inventory = history.auction_inventory;
      const inventory = auction_inventory?.inventory ?? history.inventory;
      const receipt_price =
        receipt.purpose === "LESS"
          ? resolveLegacyPriceChangeFromHistoryRemark(history.remarks)
              ?.previous_price
          : undefined;

      return {
        auction_inventory_id: history.auction_inventory_id,
        barcode: inventory?.barcode,
        control: inventory?.control || "NC",
        description: auction_inventory?.description ?? inventory?.description,
        qty: auction_inventory?.qty,
        price: receipt_price ?? auction_inventory?.price,
        manifest_number: auction_inventory?.manifest_number,
        is_slash_item: auction_inventory?.is_slash_item,
        auction_status: history.auction_status,
        inventory_status: history.inventory_status,
      };
    }),
    payments: receipt.payments.map((payment) => ({
      payment_id: payment.payment_id,
      payment_method: {
        payment_method_id: payment.payment_method?.payment_method_id ?? "",
        name: payment.payment_method?.name ?? "",
        state: payment.payment_method?.state ?? "DISABLED",
        created_at: payment.payment_method
          ? formatDate(payment.payment_method.created_at, date_format)
          : "",
        updated_at: payment.payment_method
          ? formatDate(payment.payment_method.updated_at, date_format)
          : "",
        deleted_at: payment.payment_method?.deleted_at
          ? formatDate(payment.payment_method.deleted_at, date_format)
          : "",
      },
      amount_paid: payment.amount_paid,
      created_at: formatDate(payment.created_at, date_format),
    })),
    created_at: formatDate(receipt.created_at, date_format),
  }));
}

export const GetBidderReceiptsWithItemsController = async (
  auction_bidder_id: string,
) => {
  try {
    const receipts =
      await PaymentRepository.getBidderReceiptsWithItems(auction_bidder_id);
    return ok(presenter(receipts));
  } catch (error) {
    logger("GetBidderReceiptsWithItemsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
