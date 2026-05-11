import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { uploadContainerReportFileUseCase } from "src/application/use-cases/containers/upload-container-report-file.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";

export const UploadContainerReportFileController = async (
  container_id: string,
  file: File | null,
) => {
  const ctx = RequestContext.getStore();

  try {
    const result = await uploadContainerReportFileUseCase({
      container_id,
      file,
      uploaded_by: ctx?.username ?? "",
    });

    await logActivity(
      "CREATE",
      "container_file",
      result.container_file_id,
      `Uploaded container report v${result.version} for container ${container_id}`,
    );

    return ok({
      success: true,
      message: `Container report v${result.version} uploaded.`,
      version: result.version,
    });
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      logger("UploadContainerReportFileController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UploadContainerReportFileController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
