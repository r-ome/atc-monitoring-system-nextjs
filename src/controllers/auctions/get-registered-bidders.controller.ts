import { getRegisteredBiddersUseCase } from "src/application/use-cases/auctions/get-registered-bidders.use-case";
import { RegisteredBidderSchema } from "src/entities/models/Bidder";
import { format } from "date-fns";
import { ok, err } from "src/entities/models/Response";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";

function presenter(registeredBidders: RegisteredBidderSchema[]) {
  const date_format = "hh:mm a";
  return registeredBidders.map((registeredBidder) => ({
    auction_id: registeredBidder.auction_id,
    auction_bidder_id: registeredBidder.auction_bidder_id,
    auction_date: format(registeredBidder.created_at, date_format),
    already_consumed: registeredBidder.already_consumed,
    bidder: {
      bidder_id: registeredBidder.bidder.bidder_id,
      bidder_number: registeredBidder.bidder.bidder_number,
      full_name: `${registeredBidder.bidder.first_name} ${registeredBidder.bidder.last_name}`,
      registration_fee: registeredBidder.bidder.registration_fee,
      service_charge: registeredBidder.bidder.service_charge,
    },
    auctions_inventories: registeredBidder.auctions_inventories,
    registration_fee: registeredBidder.registration_fee,
    service_charge: registeredBidder.service_charge,
    balance: registeredBidder.balance,
    created_at: format(registeredBidder.created_at, date_format),
    updated_at: format(registeredBidder.updated_at, date_format),
    deleted_at: registeredBidder.deleted_at
      ? format(registeredBidder.deleted_at, date_format)
      : null,
  }));
}

export const GetRegisteredBiddersController = async (auction_id: string) => {
  try {
    const registered_bidders = await getRegisteredBiddersUseCase(auction_id);
    return ok(presenter(registered_bidders));
  } catch (error) {
    logger("GetRegisteredBiddersController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
