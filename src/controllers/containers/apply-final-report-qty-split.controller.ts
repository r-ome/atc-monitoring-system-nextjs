import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  applyFinalReportQtySplitSchema,
  type ApplyFinalReportQtySplitInput,
} from "src/entities/models/FinalReport";
import { err, ok } from "src/entities/models/Result";
import { InventoryRepository } from "src/infrastructure/di/repositories";

export const ApplyFinalReportQtySplitController = async (
  input: Partial<ApplyFinalReportQtySplitInput>,
) => {
  const ctx = RequestContext.getStore();

  try {
    const { data, error: inputParseError } =
      applyFinalReportQtySplitSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    await InventoryRepository.applySplitBoughtItems(data, ctx?.username);

    await logActivity(
      "UPDATE",
      "inventory",
      "bulk",
      `Applied qty split: ${data.splits.length} item(s) split from source ${data.source_auction_inventory_id}`,
    );

    return ok({ count: data.splits.length });
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      logger("ApplyFinalReportQtySplitController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("ApplyFinalReportQtySplitController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
