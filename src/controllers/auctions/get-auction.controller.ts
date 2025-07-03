import { getAuctionUseCase } from "src/application/use-cases/auctions/get-auction.use-case";
import { AuctionSchema } from "src/entities/models/Auction";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";
import { formatDate } from "@/app/lib/utils";

function presenter(auction: AuctionSchema) {
  const date_format = "MMM dd, yyyy";
  const auctions_inventories = auction.registered_bidders.reduce(
    (acc, item) => [...acc, ...item.auctions_inventories],
    [] as AuctionSchema["registered_bidders"][number]["auctions_inventories"]
  );

  return {
    auction_id: auction.auction_id,
    auctions_inventories,
    auction_date: formatDate(auction.created_at, date_format),
    updated_at: formatDate(auction.updated_at, date_format),
    registered_bidders: auction.registered_bidders.map((registered_bidder) => ({
      auction_bidder_id: registered_bidder.auction_bidder_id,
      auction_id: registered_bidder.auction_id,
      auction_date: formatDate(auction.created_at, date_format),
      created_at: formatDate(
        registered_bidder.created_at,
        "MMMM dd, yyyy hh:mm a"
      ),
      service_charge: registered_bidder.service_charge,
      registration_fee: registered_bidder.registration_fee,
      already_consumed: registered_bidder.already_consumed,
      balance: registered_bidder.balance,
      bidder: {
        bidder_id: registered_bidder.bidder_id,
        bidder_number: registered_bidder.bidder.bidder_number,
        full_name: `${registered_bidder.bidder.first_name} ${registered_bidder.bidder.last_name}`,
        service_charge: registered_bidder.bidder.service_charge,
        registration_fee: registered_bidder.bidder.registration_fee,
      },
      auction_inventories: registered_bidder.auctions_inventories.map(
        (item) => ({
          auction_inventory_id: item.auction_inventory_id,
          auction_bidder_id: item.auction_bidder_id,
          inventory_id: item.inventory.inventory_id,
          receipt_id: item.receipt_id,
          description: item.description,
          status: item.status,
          price: item.price,
          qty: item.qty,
          manifest_number: item.manifest_number,
          created_at: formatDate(item.created_at, "MMMM dd, yyyy"),
          updated_at: formatDate(item.updated_at, "MMMM dd, yyyy"),
          inventory: {
            inventory_id: item.inventory_id,
            container_id: item.inventory.container_id,
            container_barcode: item.inventory.container.barcode,
            barcode: item.inventory.barcode,
            control: item.inventory.control || "NC",
            status: item.inventory.status,
          },
          receipt: {
            receipt_id: item.receipt?.receipt_id,
            receipt_number: item.receipt?.receipt_number,
          },
          histories: item.histories,
        })
      ),
    })),
  };
}

export const GetAuctionController = async (auction_date: Date) => {
  try {
    const auction = await getAuctionUseCase(auction_date);
    if (!auction) {
      throw new NotFoundError("Auction not found!");
    }
    return ok(presenter(auction));
  } catch (error) {
    logger("GetAuctionController", error);
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
};
