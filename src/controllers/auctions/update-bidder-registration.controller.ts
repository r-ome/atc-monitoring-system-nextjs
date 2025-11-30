import { logger } from "@/app/lib/logger";
import { updateBidderRegistrationUseCase } from "src/application/use-cases/auctions/update-bidder-registration.use-case";
import {
  InputParseError,
  DatabaseOperationError,
} from "src/entities/errors/common";
import {
  UpdateBidderRegistrationInput,
  type UpdateBidderRegistrationSchema,
} from "src/entities/models/Bidder";
import { err, ok } from "src/entities/models/Response";

export const UpdateBidderRegistrationController = async (
  auction_bidder_id: string,
  input: Partial<UpdateBidderRegistrationSchema>
) => {
  try {
    const { data, error: inputParseError } =
      UpdateBidderRegistrationInput.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const auction_bidder = await updateBidderRegistrationUseCase(
      auction_bidder_id,
      data
    );
    return ok(auction_bidder);
  } catch (error) {
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
