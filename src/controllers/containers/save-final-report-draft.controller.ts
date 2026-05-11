import { logger } from "@/app/lib/logger";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  saveFinalReportDraftSchema,
  type SaveFinalReportDraftInput,
} from "src/entities/models/FinalReportDraft";
import { err, ok } from "src/entities/models/Result";
import { ContainerRepository } from "src/infrastructure/di/repositories";

export const SaveFinalReportDraftController = async (
  input: Partial<SaveFinalReportDraftInput>,
) => {
  try {
    const { data, error: inputParseError } =
      saveFinalReportDraftSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const draft = { ...data.draft, updated_at: new Date().toISOString() };
    await ContainerRepository.setFinalReportDraft(data.container_id, draft);

    return ok({ container_id: data.container_id });
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      logger("SaveFinalReportDraftController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("SaveFinalReportDraftController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
