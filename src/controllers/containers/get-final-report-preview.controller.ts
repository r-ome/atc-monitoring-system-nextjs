import { logger } from "@/app/lib/logger";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  finalReportOptionsSchema,
  type FinalReportOptionsInput,
} from "src/entities/models/FinalReport";
import { err, ok } from "src/entities/models/Result";
import { getFinalReportPreviewUseCase } from "src/application/use-cases/containers/get-final-report-preview.use-case";

export const GetFinalReportPreviewController = async (
  input: Partial<FinalReportOptionsInput>,
) => {
  try {
    const { data, error: inputParseError } =
      finalReportOptionsSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const preview = await getFinalReportPreviewUseCase(data);
    return ok(preview);
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      logger("GetFinalReportPreviewController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("GetFinalReportPreviewController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
