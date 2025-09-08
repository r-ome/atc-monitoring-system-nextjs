import { RegisterBidderInputSchema } from "src/entities/models/Bidder";
import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";
import { getRegisteredBiddersUseCase } from "./get-registered-bidders.use-case";
import { InputParseError } from "src/entities/errors/common";
import { getBiddersWithBalanceUseCase } from "./get-bidders-with-balance.use-case";
import { formatDate } from "@/app/lib/utils";

export const registerBidderUseCase = async (
  data: RegisterBidderInputSchema
) => {
  const registered_bidders = await getRegisteredBiddersUseCase(data.auction_id);
  const registered_bidders_id = registered_bidders.map(
    (item) => item.bidder_id
  );
  const bidders_with_balance = await getBiddersWithBalanceUseCase();

  const match = bidders_with_balance.find(
    (item) => item.bidder_id === data.bidder_id
  );

  if (match) {
    const unpaid_items = match.auctions_inventories.filter(
      (item) => item.status === "UNPAID"
    );

    throw new InputParseError("Invalid Data!", {
      cause: `Bidder ${match.bidder.bidder_number} has still ${
        unpaid_items.length
      } unpaid items and ₱${match.balance.toLocaleString()} unpaid balance (${formatDate(
        match.created_at
      )})!`,
    });
  }

  if (registered_bidders_id.includes(data.bidder_id)) {
    throw new InputParseError("Bidder already registered!", {
      cause: "Bidder already registered in auction",
    });
  }

  return await AuctionRepository.registerBidder(data);
};
