import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  applyFinalReportDirectBoughtSchema,
  type ApplyFinalReportDirectBoughtInput,
} from "src/entities/models/FinalReport";
import { err, ok } from "src/entities/models/Result";
import { InventoryRepository } from "src/infrastructure/di/repositories";

export const ApplyFinalReportDirectBoughtController = async (
  input: Partial<ApplyFinalReportDirectBoughtInput>,
) => {
  const ctx = RequestContext.getStore();

  try {
    const { data, error: inputParseError } =
      applyFinalReportDirectBoughtSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    await InventoryRepository.applyDirectBoughtItem(data, ctx?.username);

    await logActivity(
      "UPDATE",
      "inventory",
      data.inventory_id,
      `Marked as Bought Item (direct) at price ${data.price}, qty ${data.qty}`,
    );

    return ok({ inventory_id: data.inventory_id });
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      logger("ApplyFinalReportDirectBoughtController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("ApplyFinalReportDirectBoughtController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
