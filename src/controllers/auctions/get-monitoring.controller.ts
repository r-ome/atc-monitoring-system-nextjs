import { getMonitoringUseCase } from "src/application/use-cases/auctions/get-monitoring.use-case";
import { DatabaseOperationError } from "src/entities/errors/common";
import { AuctionInventoryWithDetailsRow } from "src/entities/models/Auction";
import { ok, err } from "src/entities/models/Result";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

function presenter(monitoring: AuctionInventoryWithDetailsRow[]) {
  return monitoring.map((item) => ({
    auction_inventory_id: item.auction_inventory_id,
    auction_bidder_id: item.auction_bidder_id,
    inventory_id: item.inventory_id,
    receipt_id: item.receipt_id,
    description: item.description,
    status: item.status,
    price: item.price,
    qty: item.qty,
    manifest_number: item.manifest_number,
    is_slash_item: item.is_slash_item,
    auction_date: formatDate(item.auction_date, "MMMM dd, yyyy"),
    created_at: formatDate(item.created_at, "MMMM dd, yyyy"),
    updated_at: formatDate(item.updated_at, "MMMM dd, yyyy"),
    inventory: {
      inventory_id: item.inventory.inventory_id,
      barcode: item.inventory.barcode,
      control: item.inventory.control || "NC",
      status: item.inventory.status,
    },
    bidder: {
      bidder_id: item.auction_bidder.bidder.bidder_id,
      bidder_number: item.auction_bidder.bidder.bidder_number,
      full_name: `${item.auction_bidder.bidder.first_name} ${item.auction_bidder.bidder.last_name}`,
      service_charge: item.auction_bidder.service_charge,
      registration_fee: item.auction_bidder.registration_fee,
      already_consumed: item.auction_bidder.already_consumed,
      balance: item.auction_bidder.balance,
    },
    receipt: {
      receipt_id: item.receipt?.receipt_id,
      receipt_number: item.receipt?.receipt_number,
    },
    histories: (item.histories ?? []).map((item) => ({
      inventory_history_id: item.inventory_history_id,
      auction_status: item.auction_status,
      inventory_status: item.inventory_status,
      remarks: item.remarks,
      receipt_number: item.receipt ? item.receipt.receipt_number : null,
      created_at: formatDate(item.created_at, "MMMM dd hh:mm a"),
    })),
  }));
}

export async function GetMonitoringController(auction_id: string) {
  try {
    const monitoring = await getMonitoringUseCase(auction_id);
    return ok(presenter(monitoring));
  } catch (error) {
    logger("GetMonitoringController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
}
