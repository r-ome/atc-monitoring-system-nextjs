import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { finalizeFinalReportUseCase } from "src/application/use-cases/containers/finalize-final-report.use-case";

export const FinalizeFinalReportController = async (container_id: string) => {
  const ctx = RequestContext.getStore();

  try {
    if (!container_id) {
      throw new InputParseError("container_id is required");
    }

    const result = await finalizeFinalReportUseCase({
      container_id,
      username: ctx?.username,
    });

    await logActivity(
      "UPDATE",
      "container",
      container_id,
      "Finalized final report draft",
    );

    return ok(result);
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      logger("FinalizeFinalReportController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("FinalizeFinalReportController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred during finalize! Draft is preserved — please refresh the preview and retry.",
      cause: error instanceof Error ? error.message : "Server Error",
    });
  }
};
