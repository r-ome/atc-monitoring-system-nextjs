import { logger } from "@/app/lib/logger";
import { getContainerReportDownloadUrlUseCase } from "src/application/use-cases/containers/get-container-report-download-url.use-case";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";

export const GetContainerReportDownloadUrlController = async (
  container_file_id: string,
) => {
  try {
    const url = await getContainerReportDownloadUrlUseCase({
      container_file_id,
    });

    return ok({ url });
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger("GetContainerReportDownloadUrlController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("GetContainerReportDownloadUrlController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
