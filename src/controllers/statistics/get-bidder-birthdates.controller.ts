import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { getBidderBirthdates } from "src/application/use-cases/statistics/get-bidder-birthdates.use-case";
import { BiddersWithBirthdatesAndRecentAuctionSchema } from "src/entities/models/Bidder";

function presenter(bidders: BiddersWithBirthdatesAndRecentAuctionSchema[]) {
  const date_format = "MMM d";
  return bidders.map((bidder) => ({
    bidder_id: bidder.bidder_id,
    first_name: bidder.first_name,
    last_name: bidder.last_name,
    age: bidder.age,
    bidder_number: bidder.bidder_number,
    birthdate: formatDate(new Date(bidder.birthdate), date_format),
    last_auction_date: bidder.last_auction_date
      ? formatDate(new Date(bidder.last_auction_date), date_format)
      : "N/A",
  }));
}

export const GetBidderBirthdatesController = async () => {
  try {
    const bidders = await getBidderBirthdates();
    return ok(presenter(bidders));
  } catch (error) {
    logger("GetBidderBirthdatesController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
