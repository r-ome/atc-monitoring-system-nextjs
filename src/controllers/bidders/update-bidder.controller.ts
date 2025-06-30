import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  BidderInsertSchema,
  BidderSchema,
  type BidderInsertSchema as BidderInsertSchemaType,
} from "src/entities/models/Bidder";
import { err, ok } from "src/entities/models/Response";
import { format } from "date-fns";
import { updateBidderUseCase } from "src/application/use-cases/bidders/update-bidder.use-case";

function presenter(
  bidder: Omit<BidderSchema, "auctions_joined" | "requirements">
) {
  const date_format = "MMMM dd, yyyy";
  return {
    bidder_id: bidder.bidder_id,
    bidder_number: bidder.bidder_number,
    first_name: bidder.first_name,
    middle_name: bidder.middle_name,
    last_name: bidder.last_name,
    full_name: `${bidder.first_name} ${bidder.last_name}`,
    contact_number: bidder.contact_number,
    birthdate: bidder.birthdate ? format(bidder.birthdate, date_format) : null,
    registration_fee: bidder.registration_fee,
    service_charge: bidder.service_charge,
    registered_at: bidder.registered_at,
  };
}

export const UpdateBidderController = async (
  bidder_id: string,
  input: Partial<BidderInsertSchemaType>
) => {
  try {
    input.birthdate = input.birthdate ? new Date(input.birthdate) : null;

    const { data, error: inputParseError } =
      BidderInsertSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const updated = await updateBidderUseCase(bidder_id, data);
    return ok(presenter(updated));
  } catch (error) {
    if (error instanceof InputParseError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
