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
import { logActivity } from "@/app/lib/log-activity";
import { buildActivityLogDiff } from "@/app/lib/activity-log-diff";
import { BidderRepository } from "src/infrastructure/di/repositories";
import { formatDate, formatNumberToCurrency } from "@/app/lib/utils";
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

    const previous = await BidderRepository.getBidder(bidder_id);
    const updated = await updateBidderUseCase(bidder_id, data);
    logger("UpdateBidderController", { data, ...user_context }, "info");
    const diffDescription = buildActivityLogDiff({
      previous,
      current: updated,
      fields: [
        { label: "Bidder Number", getValue: (bidder) => bidder.bidder_number },
        { label: "First Name", getValue: (bidder) => bidder.first_name },
        { label: "Middle Name", getValue: (bidder) => bidder.middle_name },
        { label: "Last Name", getValue: (bidder) => bidder.last_name },
        {
          label: "Birthdate",
          getValue: (bidder) => bidder.birthdate,
          formatValue: (value) =>
            value instanceof Date ? formatDate(value, "MMM dd, yyyy") : "N/A",
        },
        {
          label: "Contact Number",
          getValue: (bidder) => bidder.contact_number,
        },
        {
          label: "Registration Fee",
          getValue: (bidder) => bidder.registration_fee,
          formatValue: (value) => formatNumberToCurrency(Number(value)),
        },
        {
          label: "Service Charge",
          getValue: (bidder) => bidder.service_charge,
          formatValue: (value) => `${value}%`,
        },
        { label: "Status", getValue: (bidder) => bidder.status },
        {
          label: "Payment Term",
          getValue: (bidder) => bidder.payment_term,
          formatValue: (value) => `${value} day(s)`,
        },
        {
          label: "Branch",
          getValue: (bidder) => bidder.branch?.name,
        },
      ],
    });
    const description = diffDescription
      ? `Updated bidder #${updated.bidder_number} (${updated.first_name} ${updated.last_name}) | ${diffDescription}`
      : `Updated bidder #${updated.bidder_number} (${updated.first_name} ${updated.last_name})`;
    await logActivity("UPDATE", "bidder", bidder_id, description);
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
