import {
  InputParseError,
  DatabaseOperationError,
} from "src/entities/errors/common";
import {
  RegisterBidderInput,
  type RegisterBidderInputSchema,
} from "src/entities/models/Bidder";
import { registerBidderUseCase } from "src/application/use-cases/auctions/register-bidder.use-case";
import { err, ok } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";

export const RegisterBidderController = async (
  input: Partial<RegisterBidderInputSchema>
) => {
  try {
    const { data, error: inputParseError } =
      RegisterBidderInput.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const res = await registerBidderUseCase(data);
    return ok(res);
  } catch (error) {
    logger("RegisterBidderController", error);
    if (error instanceof InputParseError) {
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
