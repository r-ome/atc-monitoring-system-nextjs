import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  createBidderRequirementSchema,
  BidderRequirementRow,
} from "src/entities/models/BidderRequirement";
import { BidderRequirementRepository } from "src/infrastructure/di/repositories";
import { formatDate } from "@/app/lib/utils";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

export const presentBidderRequirement = (row: BidderRequirementRow) => ({
  ...row,
  validity_date: row.validity_date
    ? formatDate(row.validity_date, "MMM dd, yyyy")
    : null,
  created_at: formatDate(row.created_at, "MMM dd, yyyy"),
  updated_at: formatDate(row.updated_at, "MMM dd, yyyy"),
});

export const CreateBidderRequirementController = async (
  bidder_id: string,
  input: Record<string, unknown>,
) => {
  const ctx = RequestContext.getStore();
  const user_context = { username: ctx?.username, branch_name: ctx?.branch_name };

  try {
    const parsedInput = {
      ...input,
      validity_date: input.validity_date
        ? new Date(input.validity_date as string)
        : null,
    };

    const { data, error: inputParseError } =
      createBidderRequirementSchema.safeParse(parsedInput);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const requirement = await BidderRequirementRepository.create(bidder_id, data);
    logger("CreateBidderRequirementController", { bidder_id, ...user_context }, "info");
    return ok(presentBidderRequirement(requirement));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("CreateBidderRequirementController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("CreateBidderRequirementController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
