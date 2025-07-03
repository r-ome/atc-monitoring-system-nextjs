import { getAuctionItemDetailsUseCase } from "src/application/use-cases/inventories/get-auction-item-details.use-case";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Response";
import { AuctionsInventorySchema } from "src/entities/models/Auction";
import { logger } from "@/app/lib/logger";
import { formatDate } from "@/app/lib/utils";

const presenter = (auction_inventory: AuctionsInventorySchema) => {
  const date_format = "MMMM dd, yyyy";
  return {
    auction_inventory_id: auction_inventory.auction_inventory_id,
    auction_bidder_id: auction_inventory.auction_bidder_id,
    inventory_id: auction_inventory.inventory_id,
    receipt_id: auction_inventory.receipt_id,
    description: auction_inventory.description,
    status: auction_inventory.status,
    price: auction_inventory.price,
    qty: auction_inventory.qty,
    manifest_number: auction_inventory.manifest_number,
    created_at: formatDate(auction_inventory.created_at, date_format),
    updated_at: formatDate(auction_inventory.updated_at, date_format),
    inventory: {
      inventory_id: auction_inventory.inventory_id,
      barcode: auction_inventory.inventory.barcode,
      control: auction_inventory.inventory.control || "NC",
      status: auction_inventory.inventory.status,
    },
    bidder: {
      bidder_id: auction_inventory.auction_bidder.bidder.bidder_id,
      bidder_number: auction_inventory.auction_bidder.bidder.bidder_number,
      full_name: `${auction_inventory.auction_bidder.bidder.first_name} ${auction_inventory.auction_bidder.bidder.last_name}`,
      service_charge: auction_inventory.auction_bidder.service_charge,
      registration_fee: auction_inventory.auction_bidder.registration_fee,
      already_consumed: auction_inventory.auction_bidder.already_consumed,
      balance: auction_inventory.auction_bidder.balance,
    },
    receipt: {
      receipt_id: auction_inventory.receipt_id,
      receipt_number: auction_inventory.receipt?.receipt_number,
    },
    histories: auction_inventory.histories.map((item) => ({
      inventory_history_id: item.inventory_history_id,
      auction_status: item.auction_status,
      inventory_status: item.inventory_status,
      remarks: item.remarks,
      receipt_number: item.receipt ? item.receipt.receipt_number : null,
      created_at: formatDate(item.created_at, "MMMM dd hh:mm a"),
    })),
  };
};

export const GetAuctionItemDetailsController = async (
  auction_inventory_id: string
) => {
  try {
    const auction_inventory = await getAuctionItemDetailsUseCase(
      auction_inventory_id
    );
    return ok(presenter(auction_inventory));
  } catch (error) {
    logger("GetAuctionItemDetailsController", error);
    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error?.cause });
    }

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
