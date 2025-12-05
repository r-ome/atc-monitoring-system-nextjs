import { BidderInsertSchema } from "src/entities/models/Bidder";
import { BidderRepository } from "src/infrastructure/repositories/bidders.repository";
import { formatNumberPadding } from "@/app/lib/utils";
import { getBranchWithBiddersUseCase } from "../branches/get-branches-with-bidders.use-case";
import { InputParseError } from "src/entities/errors/common";

export const createBidderUseCase = async (bidder: BidderInsertSchema) => {
  bidder.bidder_number = formatNumberPadding(bidder.bidder_number, 4);

  const branch = await getBranchWithBiddersUseCase(bidder.branch_id);

  const match = branch.bidders.find(
    (item) => item.bidder_number === bidder.bidder_number
  );
  if (match) {
    throw new InputParseError("Invalid Data!", {
      cause: `${bidder.bidder_number} already taken in ${branch.name}!`,
    });
  }

  return await BidderRepository.createBidder(bidder);
};
