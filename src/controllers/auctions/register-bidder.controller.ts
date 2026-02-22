import {
  InputParseError,
  DatabaseOperationError,
} from "src/entities/errors/common";
import {
  registerBidderSchema,
  RegisterBidderInput,
} from "src/entities/models/Bidder";
import { registerBidderUseCase } from "src/application/use-cases/auctions/register-bidder.use-case";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

export const RegisterBidderController = async (
  input: Partial<RegisterBidderInput>,
) => {
  try {
    const { data, error: inputParseError } =
      registerBidderSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const total_amount_paid = data.payments.reduce(
      (acc, item) => (acc += item.amount_paid),
      0,
    );

    if (total_amount_paid !== data.registration_fee) {
      throw new InputParseError("Invalid Data!", {
        cause: {
          amount_paid: [
            `Amount Paid should be equal to (₱${data.registration_fee.toLocaleString()})`,
          ],
        },
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
