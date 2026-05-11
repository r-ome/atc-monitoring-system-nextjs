import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  applyFinalReportCounterCheckMatchesSchema,
  type ApplyFinalReportCounterCheckMatchesInput,
} from "src/entities/models/FinalReport";
import { err, ok } from "src/entities/models/Result";
import { InventoryRepository } from "src/infrastructure/di/repositories";

export const ApplyFinalReportCounterCheckMatchesController = async (
  input: Partial<ApplyFinalReportCounterCheckMatchesInput>,
) => {
  const ctx = RequestContext.getStore();

  try {
    const { data, error: inputParseError } =
      applyFinalReportCounterCheckMatchesSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    await InventoryRepository.resolveFinalReportCounterCheckMatches(
      data,
      ctx?.username,
    );

    await logActivity(
      "UPDATE",
      "inventory",
      "bulk",
      `Resolved ${data.matches.length} final report counter-check match(es)`,
    );

    return ok({ count: data.matches.length });
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      logger("ApplyFinalReportCounterCheckMatchesController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("ApplyFinalReportCounterCheckMatchesController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
