import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { getBidderByBidderNumberUseCase } from "src/application/use-cases/bidders/get-bidder-by-bidder-number.use-case";
import { BidderWithDetailsRow } from "src/entities/models/Bidder";
import { formatDate } from "@/app/lib/utils";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

const presenter = (bidder: BidderWithDetailsRow) => {
  return {
    ...bidder,
    remarks: bidder.remarks || undefined,
    full_name: `${bidder.first_name} ${bidder.last_name}`,
    birthdate: bidder.birthdate
      ? formatDate(bidder.birthdate, "MMM dd, yyy")
      : null,
    address: bidder.address,
    store_name: bidder.store_name,
    tin_number: bidder.tin_number,
    created_at: bidder.created_at
      ? formatDate(bidder.created_at, "MMM dd, yyyy")
      : "",
    updated_at: bidder.updated_at
      ? formatDate(bidder.updated_at, "MMM dd, yyyy")
      : "",
    deleted_at: bidder.deleted_at
      ? formatDate(bidder.deleted_at, "MMM dd, yyyy")
      : "",
    auctions_joined: bidder.auctions_joined.map((auction) => ({
      auction_bidder_id: auction.auction_bidder_id,
      auction_id: auction.auction_id,
      service_charge: auction.service_charge,
      registration_fee: auction.registration_fee,
      balance: auction.balance,
      created_at: formatDate(auction.created_at, "MMM dd, yyyy"),
      auctions_inventories: auction.auctions_inventories,
    })),
  };
};

export const GetBidderByBidderNumberController = async (
  bidder_number: string,
  branch_name: string,
) => {
  try {
    const bidder = await getBidderByBidderNumberUseCase(
      bidder_number,
      branch_name,
    );

    if (!bidder) {
      return err({ message: "Server Error", cause: "BIDDER NOT FOUND!" });
    }

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
