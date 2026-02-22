import { CreateBidderInput } from "src/entities/models/Bidder";
import { BidderRepository } from "src/infrastructure/repositories/bidders.repository";
import { InputParseError, NotFoundError } from "src/entities/errors/common";
import { formatNumberPadding } from "@/app/lib/utils";
import { getBidderByBidderNumberUseCase } from "./get-bidder-by-bidder-number.use-case";
import { getBranchUseCase } from "../branches/get-branch.use-case";

export const updateBidderUseCase = async (
  bidder_id: string,
  input: CreateBidderInput,
) => {
  input.bidder_number = formatNumberPadding(input.bidder_number, 4);
  const branch = await getBranchUseCase(input.branch_id);

  if (!branch) {
    throw new NotFoundError("Branch not found!");
  }

  const bidder = await getBidderByBidderNumberUseCase(
    input.bidder_number,
    branch.name
  );

  if (bidder) {
    if (bidder.bidder_id !== bidder_id) {
      if (bidder.bidder_number === input.bidder_number) {
        throw new InputParseError("Invalid Data!", {
          cause: {
            bidder_number: [`Bidder Number already taken on ${branch.name}!`],
          },
        });
      }
    }
  }

  return BidderRepository.updateBidder(bidder_id, input);
};
