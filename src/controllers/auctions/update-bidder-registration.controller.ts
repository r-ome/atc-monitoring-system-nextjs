import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { AuctionRepository } from "src/infrastructure/di/repositories";
import {
  InputParseError,
  DatabaseOperationError,
} from "src/entities/errors/common";
import {
  updateBidderRegistrationSchema,
  UpdateBidderRegistrationInput,
} from "src/entities/models/Bidder";
import { err, ok } from "src/entities/models/Result";

export const UpdateBidderRegistrationController = async (
  auction_bidder_id: string,
  input: Partial<UpdateBidderRegistrationInput>,
) => {
  try {
    const { data, error: inputParseError } =
      updateBidderRegistrationSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const current = await AuctionRepository.getRegisteredBidderById(auction_bidder_id);
    const auction_bidder = await AuctionRepository.updateBidderRegistration(
      auction_bidder_id,
      data,
    );
    await logActivity(
      "UPDATE",
      "auction_bidder",
      auction_bidder_id,
      `Updated bidder registration fee from ₱${current?.registration_fee.toLocaleString() ?? "?"} to ₱${data.registration_fee.toLocaleString()}`,
    );
    return ok(auction_bidder);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateBidderRegistrationController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateBidderRegistrationController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
