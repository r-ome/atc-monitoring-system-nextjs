import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { AuctionRepository } from "src/infrastructure/di/repositories";
import { cancelItemsSchema, CancelItemsInput } from "src/entities/models/Inventory";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";

export const CancelItemsController = async (
  input: Partial<CancelItemsInput>,
) => {
  const ctx = RequestContext.getStore();

  try {
    const { data, error: inputParseError } = cancelItemsSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const res = await AuctionRepository.cancelItems(data, ctx?.username);
    await logActivity("UPDATE", "auction_inventory", data.auction_bidder_id, `Cancelled ${data.auction_inventory_ids.length} item(s) from bidder #${res.bidder_number} (${res.first_name} ${res.last_name}): ${data.reason}`);
    return ok(res);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("CancelItemsController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }

    if (error instanceof NotFoundError) {
      logger("CancelItemsController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }

    logger("CancelItemsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
