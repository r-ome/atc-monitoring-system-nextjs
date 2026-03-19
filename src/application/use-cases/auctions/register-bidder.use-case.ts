import { RegisterBidderInput } from "src/entities/models/Bidder";
import { AuctionRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { formatDate } from "@/app/lib/utils";
import { differenceInCalendarDays } from "date-fns";

export const registerBidderUseCase = async (
  data: RegisterBidderInput,
) => {
  const registered_bidders = await AuctionRepository.getRegisteredBidders(data.auction_id);
  const registered_bidders_id = registered_bidders.map(
    (item) => item.bidder_id,
  );
  const bidders_with_balance = await AuctionRepository.getBiddersWithBalance();

  const match = bidders_with_balance.find(
    (item) => item.bidder_id === data.bidder_id,
  );

  if (match) {
    const prev_auction = await AuctionRepository.getAuctionById(match.auction_id);
    const current_auction = await AuctionRepository.getAuctionById(data.auction_id);
    if (!prev_auction || !current_auction) {
      throw new DatabaseOperationError("No auction found");
    }

    const difference_in_days = differenceInCalendarDays(
      current_auction.created_at,
      prev_auction?.created_at,
    );

    if (match.bidder.payment_term <= difference_in_days) {
      const unpaid_items = match.auctions_inventories.filter(
        (item) => item.status === "UNPAID",
      );

      throw new InputParseError("Invalid Data!", {
        cause: {
          bidder: [
            `Bidder ${match.bidder.bidder_number} has still ${
              unpaid_items.length
            } unpaid items and ₱${match.balance.toLocaleString()} unpaid balance (${formatDate(
              prev_auction.created_at,
            )})! (${difference_in_days} days exceeding payment term!)`,
          ],
        },
      });
    }
  }

  if (registered_bidders_id.includes(data.bidder_id)) {
    throw new InputParseError("Bidder already registered!", {
      cause: { bidder: ["Bidder already registered in auction"] },
    });
  }

  return await AuctionRepository.registerBidder(data);
};
