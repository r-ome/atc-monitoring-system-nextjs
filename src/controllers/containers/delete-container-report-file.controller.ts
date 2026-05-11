import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { deleteContainerReportFileUseCase } from "src/application/use-cases/containers/delete-container-report-file.use-case";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";

export const DeleteContainerReportFileController = async (
  container_file_id: string,
) => {
  const ctx = RequestContext.getStore();

  try {
    const result = await deleteContainerReportFileUseCase({
      container_file_id,
      deleted_by: ctx?.username ?? "",
    });

    await logActivity(
      "DELETE",
      "container_file",
      result.container_file_id,
      `Deleted container report v${result.version}`,
    );

    return ok({
      success: true,
      message: `Container report v${result.version} deleted.`,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger("DeleteContainerReportFileController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("DeleteContainerReportFileController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
