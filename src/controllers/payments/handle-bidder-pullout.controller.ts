import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { PaymentRepository } from "src/infrastructure/di/repositories";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  pullOutPaymentSchema,
  PullOutPaymentInput,
} from "src/entities/models/Payment";
import { err, ok } from "src/entities/models/Result";

export const HandleBidderPullOutController = async (
  input: Partial<PullOutPaymentInput>,
) => {
  try {
    const { data, error: inputParseError } =
      pullOutPaymentSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const total_amount_paid = data.payments.reduce(
      (acc, item) => (acc += item.amount_paid),
      0,
    );

    if (total_amount_paid !== data.amount_to_be_paid) {
      throw new InputParseError("Invalid Data!", {
        cause: {
          amount_paid: [
            `Amount Paid should be equal to Grand Total(₱${data.amount_to_be_paid.toLocaleString()})`,
          ],
        },
      });
    }

    const res = await PaymentRepository.handleBidderPullOut(data);
    await logActivity("CREATE", "payment", res.receipt_id, `Pull-out payment ₱${data.amount_to_be_paid.toLocaleString()} for bidder`);
    return ok(res);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("HandleBidderPullOutController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("HandleBidderPullOutController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error?.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
