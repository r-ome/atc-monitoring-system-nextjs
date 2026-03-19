import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { updateBidderSchema } from "src/entities/models/Bidder";
import { err, ok } from "src/entities/models/Result";
import { updateBidderUseCase } from "src/application/use-cases/bidders/update-bidder.use-case";
import { logger } from "@/app/lib/logger";
import { presentBidder } from "./create-bidder.controller";

export const UpdateBidderController = async (
  bidder_id: string,
  input: Record<string, unknown>,
) => {
  const ctx = RequestContext.getStore();
  const user_context = {
    username: ctx?.username,
    branch_name: ctx?.branch_name,
  };

  try {
    const parsedInput = {
      ...input,
      birthdate: input.birthdate ? new Date(input.birthdate as string) : null,
    };

    const { data, error: inputParseError } =
      updateBidderSchema.safeParse(parsedInput);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const updated = await updateBidderUseCase(bidder_id, data);
    logger("UpdateBidderController", { data, ...user_context }, "info");
    return ok(presentBidder(updated));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateBidderController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UpdateBidderController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateBidderController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
