import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { updateBidderRequirementSchema } from "src/entities/models/BidderRequirement";
import { BidderRequirementRepository } from "src/infrastructure/di/repositories";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { presentBidderRequirement } from "./create-bidder-requirement.controller";

export const UpdateBidderRequirementController = async (
  requirement_id: string,
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
      updateBidderRequirementSchema.safeParse(parsedInput);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const requirement = await BidderRequirementRepository.update(requirement_id, data);
    logger("UpdateBidderRequirementController", { requirement_id, ...user_context }, "info");
    return ok(presentBidderRequirement(requirement));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateBidderRequirementController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UpdateBidderRequirementController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateBidderRequirementController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
