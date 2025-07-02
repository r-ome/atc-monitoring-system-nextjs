import { getRegisteredBidderUseCase } from "src/application/use-cases/auctions/get-registered-bidder.use-case";
import { RegisteredBidderSchema } from "src/entities/models/Bidder";
import { format } from "date-fns";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";

function presenter(registeredBidder: RegisteredBidderSchema) {
  const date_format = "MMMM dd, yyyy";
  return {
    auction_id: registeredBidder.auction_id,
    auction_date: format(registeredBidder.created_at, date_format),
    auction_bidder_id: registeredBidder.auction_bidder_id,
    created_at: format(registeredBidder.created_at, "hh:mm a"),
    already_consumed: registeredBidder.already_consumed,
    balance: registeredBidder.balance,
    bidder: {
      bidder_id: registeredBidder.bidder.bidder_id,
      bidder_number: registeredBidder.bidder.bidder_number,
      full_name: `${registeredBidder.bidder.first_name} ${registeredBidder.bidder.last_name}`,
      service_charge: registeredBidder.bidder.service_charge,
      registration_fee: registeredBidder.bidder.registration_fee,
    },
    service_charge: registeredBidder.service_charge,
    registration_fee: registeredBidder.registration_fee,
    auction_inventories: registeredBidder.auctions_inventories.map(
      (auction_inventory) => ({
        auction_inventory_id: auction_inventory.auction_inventory_id,
        auction_bidder_id: auction_inventory.auction_bidder_id,
        inventory_id: auction_inventory.inventory.inventory_id,
        receipt_id: auction_inventory.receipt_id,
        description: auction_inventory.description,
        status: auction_inventory.status,
        price: auction_inventory.price,
        qty: auction_inventory.qty,
        manifest_number: auction_inventory.manifest_number,
        created_at: format(auction_inventory.created_at, "MMMM dd, yyyy"),
        updated_at: format(auction_inventory.updated_at, "MMMM dd, yyyy"),
        inventory: {
          inventory_id: auction_inventory.inventory_id,
          container_id: auction_inventory.inventory.container_id,
          container_barcode: auction_inventory.inventory.container.barcode,
          barcode: auction_inventory.inventory.barcode,
          control: auction_inventory.inventory.control || "NC",
          status: auction_inventory.inventory.status,
        },
        receipt: {
          receipt_id: auction_inventory.receipt?.receipt_id,
          receipt_number: auction_inventory.receipt?.receipt_number,
        },
        histories: auction_inventory.histories,
      })
    ),
  };
}

export async function GetRegisteredBidderController(
  bidder_number: string,
  auction_date: string
) {
  try {
    const registered_bidder = await getRegisteredBidderUseCase(
      bidder_number,
      new Date(auction_date)
    );

    return ok(presenter(registered_bidder));
  } catch (error) {
    logger("GetRegisteredBidderController", error);
    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
}
