import { PaymentRepository } from "src/infrastructure/di/repositories";
import { ReceiptRecordWithHistoriesRow } from "src/entities/models/Payment";
import { ok, err } from "src/entities/models/Result";
import { formatDate } from "@/app/lib/utils";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { parseInventoryHistoryRemark } from "src/entities/models/InventoryHistoryRemark";

function resolveLegacyPriceChangeFromHistoryRemark(remarks: string | null | undefined) {
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

function presenter(receipt: ReceiptRecordWithHistoriesRow) {
  const date_format = "MMMM dd, yyyy hh:mm:ss a";

  const getReceiptPrice = (auction_inventory: {
    price: number;
    histories: {
      receipt_id: string | null;
      remarks: string | null;
    }[];
  }) => {
    if (!auction_inventory) return;

    if (receipt.purpose !== "LESS") return auction_inventory.price;

    const receiptHistory = auction_inventory.histories.find(
      (history) => history.receipt_id === receipt.receipt_id,
    );
    if (!receiptHistory) return auction_inventory.price;

    const priceChange = resolveLegacyPriceChangeFromHistoryRemark(
      receiptHistory.remarks,
    );
    return priceChange?.previous_price ?? auction_inventory.price;
  };

  return {
    receipt_id: receipt.receipt_id,
    receipt_number: receipt.receipt_number,
    auction_bidder_id: receipt.auction_bidder_id,
    purpose: receipt.purpose,
    auction_date: formatDate(
      receipt.auction_bidder.created_at,
      "MMMM dd, yyyy",
    ),
    total_amount_paid: receipt.payments.reduce(
      (acc, item) => (acc += item.amount_paid),
      0,
    ),
    created_at: formatDate(receipt.created_at, date_format),
    remarks: receipt.remarks,
    bidder: {
      bidder_id: receipt.auction_bidder.bidder.bidder_id,
      bidder_number: receipt.auction_bidder.bidder.bidder_number,
      full_name: `${receipt.auction_bidder.bidder.first_name} ${receipt.auction_bidder.bidder.last_name}`,
      service_charge: receipt.auction_bidder.service_charge,
      registration_fee: receipt.auction_bidder.registration_fee,
      already_consumed: receipt.auction_bidder.already_consumed,
    },
    auctions_inventories: receipt.inventory_histories?.map((item) => {
      let receipt_price;
      if (item.auction_inventory) {
        receipt_price = getReceiptPrice(item.auction_inventory);
      }

      return {
        auction_inventory_id: item.auction_inventory_id,
        barcode: item.auction_inventory?.inventory.barcode,
        control: item.auction_inventory?.inventory.control || "NC",
        description: item.auction_inventory?.description,
        qty: item.auction_inventory?.qty,
        price: receipt_price ? receipt_price : item.auction_inventory?.price,
        manifest_number: item.auction_inventory?.manifest_number,
        is_slash_item: item.auction_inventory?.is_slash_item,
      };
    }),
    payments: receipt.payments.map((payment) => ({
      payment_id: payment.payment_id,
      payment_method: {
        payment_method_id: payment?.payment_method?.payment_method_id ?? "",
        name: payment?.payment_method?.name ?? "",
        state: payment?.payment_method?.state ?? "DISABLED",
        created_at: payment?.payment_method
          ? formatDate(payment?.payment_method?.created_at, date_format)
          : "",
        updated_at: payment?.payment_method
          ? formatDate(payment?.payment_method?.updated_at, date_format)
          : "",
        deleted_at: payment?.payment_method?.deleted_at
          ? formatDate(payment?.payment_method?.deleted_at, date_format)
          : "",
      },
      amount_paid: payment.amount_paid,
      remarks: payment?.remarks,
      created_at: formatDate(payment.created_at, date_format),
    })),
  };
}

export const GetReceiptDetailsController = async (
  auction_id: string,
  receipt_number: string,
) => {
  try {
    const receipt = await PaymentRepository.getReceiptDetails(auction_id, receipt_number);
    return ok(presenter(receipt));
  } catch (error) {
    logger("GetReceiptDetailsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
