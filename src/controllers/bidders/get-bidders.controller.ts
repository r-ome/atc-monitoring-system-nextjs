import { BidderSchema } from "src/entities/models/Bidder";
import { getBiddersUseCase } from "src/application/use-cases/bidders/get-bidders.use-case";
import { format } from "date-fns";
import { ok, err } from "src/entities/models/Response";
import { DatabaseOperationError } from "src/entities/errors/common";

const presenter = (
  bidders: Omit<BidderSchema, "auctions_joined" | "requirements">[]
) => {
  const date_format = "MMM dd, yyyy";
  return bidders.map((item) => ({
    ...item,
    remarks: item.remarks || undefined,
    full_name: `${item.first_name} ${item.last_name}`,
    birthdate: item.birthdate ? format(item.birthdate, date_format) : null,
    created_at: format(item.created_at, date_format),
    updated_at: format(item.updated_at, date_format),
    deleted_at: item.deleted_at ? format(item.created_at, date_format) : null,
  }));
};

export const getBiddersController = async () => {
  try {
    const bidders = await getBiddersUseCase();
    return ok(presenter(bidders));
  } catch (error) {
    if (error instanceof DatabaseOperationError) {
      return err({
        message: "Server Error",
        cause: error.message,
      });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
