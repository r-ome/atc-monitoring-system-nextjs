import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { createBidderUseCase } from "src/application/use-cases/bidders/create-bidder.use-case";
import {
  BidderInsertSchema,
  type BidderSchema,
  type BidderInsertSchema as BidderInsertSchemaType,
} from "src/entities/models/Bidder";
import { formatDate } from "@/app/lib/utils";
import { err, ok } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";

const presenter = (
  bidder: Omit<BidderSchema, "auctions_joined" | "requirements">
) => {
  const date_format = "MMM dd, yyyy";
  return {
    ...bidder,
    full_name: `${bidder.first_name} ${bidder.last_name}`,
    birthdate: bidder.birthdate
      ? formatDate(bidder.birthdate, date_format)
      : null,
    created_at: formatDate(bidder.created_at, date_format),
    updated_at: formatDate(bidder.updated_at, date_format),
  };
};

export const CreateBidderController = async (
  input: Partial<BidderInsertSchemaType>
) => {
  try {
    input = {
      ...input,
      birthdate: input?.birthdate ? new Date(input?.birthdate) : null,
    };

    const { data, error: inputParseError } =
      BidderInsertSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const bidder = await createBidderUseCase(data);
    return ok(presenter(bidder));
  } catch (error) {
    logger("CreateBidderController", error);
    if (error instanceof DatabaseOperationError) {
      return err({
        message: "Server Error",
        cause: error.message,
      });
    }

    if (error instanceof InputParseError) {
      return err({
        message: error.message,
        cause: error.cause,
      });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
