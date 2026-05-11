import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  createFinalReportAddOnsSchema,
  type CreateFinalReportAddOnsInput,
} from "src/entities/models/FinalReport";
import { err, ok } from "src/entities/models/Result";
import { InventoryRepository } from "src/infrastructure/di/repositories";

export const CreateFinalReportAddOnsController = async (
  input: Partial<CreateFinalReportAddOnsInput>,
) => {
  const ctx = RequestContext.getStore();

  try {
    const { data, error: inputParseError } =
      createFinalReportAddOnsSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    await InventoryRepository.createFinalReportAddOns(data, ctx?.username);

    await logActivity(
      "UPDATE",
      "inventory",
      "bulk",
      `Created ${data.items.length} final report add-on(s)`,
    );

    return ok({ count: data.items.length });
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      logger("CreateFinalReportAddOnsController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("CreateFinalReportAddOnsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
