import { logger } from "@/app/lib/logger";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { ContainerRepository } from "src/infrastructure/di/repositories";

export const GetFinalReportDraftController = async (container_id: string) => {
  try {
    const draft = await ContainerRepository.getFinalReportDraft(container_id);
    return ok(draft);
  } catch (error) {
    logger("GetFinalReportDraftController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
