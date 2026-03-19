import { AuctionRepository } from "src/infrastructure/di/repositories";
import { RegisteredBidderSummaryRow } from "src/entities/models/Bidder";
import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";

function presenter(registeredBidders: RegisteredBidderSummaryRow[]) {
  const date_format = "hh:mm a";
  return registeredBidders.map((registeredBidder) => ({
    auction_id: registeredBidder.auction_id,
    auction_bidder_id: registeredBidder.auction_bidder_id,
    auction_date: formatDate(registeredBidder.created_at, date_format),
    already_consumed: registeredBidder.already_consumed,
    bidder: {
      bidder_id: registeredBidder.bidder.bidder_id,
      bidder_number: registeredBidder.bidder.bidder_number,
      full_name: `${registeredBidder.bidder.first_name} ${registeredBidder.bidder.last_name}`,
      registration_fee: registeredBidder.bidder.registration_fee,
      service_charge: registeredBidder.bidder.service_charge,
    },
    auction_inventories_count: registeredBidder._count.auctions_inventories,
    registration_fee: registeredBidder.registration_fee,
    service_charge: registeredBidder.service_charge,
    balance: registeredBidder.balance,
    created_at: formatDate(registeredBidder.created_at, date_format),
  }));
}

export const GetRegisteredBiddersSummaryController = async (
  auction_id: string,
) => {
  try {
    const registered_bidders =
      await AuctionRepository.getRegisteredBiddersSummary(auction_id);
    return ok(presenter(registered_bidders));
  } catch (error) {
    logger("GetRegisteredBiddersSummaryController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
