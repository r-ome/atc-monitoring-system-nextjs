import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { getBidderByBidderNumberUseCase } from "src/application/use-cases/bidders/get-bidder-by-bidder-number.use-case";
import { BidderSchema } from "src/entities/models/Bidder";
import { format } from "date-fns";
import { err, ok } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";

const presenter = (bidder: BidderSchema) => {
  return {
    ...bidder,
    remarks: bidder.remarks || undefined,
    full_name: `${bidder.first_name} ${bidder.last_name}`,
    birthdate: bidder.birthdate
      ? format(bidder.birthdate, "MMM dd, yyy")
      : null,
    created_at: bidder.created_at
      ? format(bidder.created_at, "MMM dd, yyyy")
      : "",
    updated_at: bidder.updated_at
      ? format(bidder.updated_at, "MMM dd, yyyy")
      : "",
    deleted_at: bidder.deleted_at
      ? format(bidder.deleted_at, "MMM dd, yyyy")
      : "",
    auctions_joined: bidder.auctions_joined.map((auction) => ({
      auction_bidder_id: auction.auction_bidder_id,
      auction_id: auction.auction_id,
      service_charge: auction.service_charge,
      registration_fee: auction.registration_fee,
      balance: auction.balance,
      created_at: format(auction.created_at, "MMM dd, yyyy"),
      auctions_inventories: auction.auctions_inventories,
    })),
  };
};

export const GetBidderByBidderNumberController = async (
  bidderNumber: string
) => {
  try {
    const bidder = await getBidderByBidderNumberUseCase(bidderNumber);
    return ok(presenter(bidder));
  } catch (error) {
    logger("GetBidderByBidderNumberController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error.cause });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
