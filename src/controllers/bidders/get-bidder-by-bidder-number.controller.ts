import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { BidderRepository } from "src/infrastructure/di/repositories";
import { BidderWithDetailsAndReceiptsRow } from "src/entities/models/Bidder";
import { formatDate } from "@/app/lib/utils";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

const presenter = (bidder: BidderWithDetailsAndReceiptsRow) => {
  return {
    ...bidder,
    remarks: bidder.remarks || undefined,
    full_name: `${bidder.first_name} ${bidder.last_name}`,
    birthdate: bidder.birthdate
      ? formatDate(bidder.birthdate, "MMM dd, yyyy")
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
      total_paid: auction.receipt_records
        .flatMap((r) => r.payments)
        .reduce((sum, p) => sum + p.amount_paid, 0),
      total_items: auction.auctions_inventories.length,
      created_at: formatDate(auction.created_at, "MMM dd, yyyy"),
      auction_date: formatDate(auction.created_at, "yyyy-MM-dd"),
    })),
    requirements: bidder.requirements.map((req) => ({
      ...req,
      validity_date: req.validity_date
        ? formatDate(req.validity_date, "MMM dd, yyyy")
        : null,
      created_at: formatDate(req.created_at, "MMM dd, yyyy"),
      updated_at: formatDate(req.updated_at, "MMM dd, yyyy"),
    })),
  };
};

export const GetBidderByBidderNumberController = async (
  bidder_number: string,
  branch_name: string,
) => {
  try {
    const bidder = await BidderRepository.getBidderByBidderNumber(
      bidder_number,
      branch_name,
    );

    if (!bidder) {
      return err({ message: "Server Error", cause: "BIDDER NOT FOUND!" });
    }

    return ok(presenter(bidder));
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger("GetBidderByBidderNumberController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("GetBidderByBidderNumberController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
