import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { buildActivityLogDiff } from "@/app/lib/activity-log-diff";
import { formatNumberToCurrency } from "@/app/lib/utils";
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

    const current =
      await AuctionRepository.getRegisteredBidderById(auction_bidder_id);
    const auction_bidder = await AuctionRepository.updateBidderRegistration(
      auction_bidder_id,
      data,
    );
    const diffDescription = current
      ? buildActivityLogDiff({
          previous: {
            registration_fee: current.registration_fee,
            service_charge: current.service_charge,
          },
          current: {
            registration_fee: auction_bidder.registration_fee,
            service_charge: auction_bidder.service_charge,
          },
          fields: [
            {
              label: "Registration Fee",
              getValue: (bidder) => bidder.registration_fee,
              formatValue: (value) => formatNumberToCurrency(Number(value)),
            },
            {
              label: "Service Charge",
              getValue: (bidder) => bidder.service_charge,
              formatValue: (value) => `${value}%`,
            },
          ],
        }).replaceAll(" -> ", " → ")
      : "";
    const bidderNumber = current?.bidder.bidder_number ?? "?";
    const description = diffDescription
      ? `Updated bidder registration #${bidderNumber} | ${diffDescription}`
      : `Updated bidder registration #${bidderNumber}`;
    await logActivity(
      "UPDATE",
      "auction_bidder",
      auction_bidder_id,
      description,
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
