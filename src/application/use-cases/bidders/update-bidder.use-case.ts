import { BidderInsertSchema } from "src/entities/models/Bidder";
import { BidderRepository } from "src/infrastructure/repositories/bidders.repository";
import { getBidderUseCase } from "./get-bidder.use-case";
import { InputParseError } from "src/entities/errors/common";
import { formatNumberPadding } from "@/app/lib/utils";
import { getBidderByBidderNumberUseCase } from "./get-bidder-by-bidder-number.use-case";

export const updateBidderUseCase = async (
  bidder_id: string,
  input: BidderInsertSchema
) => {
  input.bidder_number = formatNumberPadding(input.bidder_number, 4);
  const bidder = await getBidderByBidderNumberUseCase(input.bidder_number);

  if (bidder) {
    if (bidder.bidder_id !== bidder_id) {
      if (bidder.bidder_number === input.bidder_number) {
        throw new InputParseError("Invalid Data!", {
          cause: {
            bidder_number: ["Bidder Number already taken!"],
          },
        });
      }
    }
  }

  return BidderRepository.updateBidder(bidder_id, input);
};
