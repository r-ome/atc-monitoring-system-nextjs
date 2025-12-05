import { BidderSchema } from "src/entities/models/Bidder";
import { getBiddersUseCase } from "src/application/use-cases/bidders/get-bidders.use-case";
import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Response";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";

const presenter = (
  bidders: Omit<BidderSchema, "auctions_joined" | "requirements">[]
) => {
  const date_format = "MMM dd, yyyy";
  return bidders.map((item) => ({
    ...item,
    branch: {
      branch_id: item.branch.branch_id,
      name: item.branch.name,
    },
    remarks: item.remarks || undefined,
    full_name: `${item.first_name} ${item.last_name}`,
    birthdate: item.birthdate ? formatDate(item.birthdate, date_format) : null,
    created_at: formatDate(item.created_at, date_format),
    updated_at: formatDate(item.updated_at, date_format),
    deleted_at: item.deleted_at
      ? formatDate(item.created_at, date_format)
      : null,
  }));
};

export const GetBiddersController = async () => {
  try {
    const bidders = await getBiddersUseCase();
    return ok(presenter(bidders));
  } catch (error) {
    logger("GetBiddersController", error);
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
