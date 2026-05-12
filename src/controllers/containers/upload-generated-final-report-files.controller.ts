import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { uploadGeneratedFinalReportFilesUseCase } from "src/application/use-cases/containers/upload-generated-final-report-files.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";

export const UploadGeneratedFinalReportFilesController = async (
  container_id: string,
  original_file: File | null,
  modified_file: File | null,
) => {
  const ctx = RequestContext.getStore();

  try {
    const result = await uploadGeneratedFinalReportFilesUseCase({
      container_id,
      original_file,
      modified_file,
      uploaded_by: ctx?.username ?? "",
    });

    await logActivity(
      "CREATE",
      "container_file",
      result.files.map((file) => file.container_file_id).join(","),
      `Uploaded generated final report v${result.version} for container ${container_id}`,
    );

    return ok({
      success: true,
      message: `Generated final report v${result.version} uploaded.`,
      version: result.version,
    });
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      logger("UploadGeneratedFinalReportFilesController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UploadGeneratedFinalReportFilesController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
