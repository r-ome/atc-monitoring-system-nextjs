import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { uploadGeneratedFinalReportFilesUseCase } from "src/application/use-cases/containers/upload-generated-final-report-files.use-case";
import { ContainerRepository } from "src/infrastructure/di/repositories";
import { buildFinalReportGenerationLogDescription } from "./log-final-report-generation.controller";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { LogFinalReportGenerationInput } from "src/entities/models/Container";
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

    let barcode = container_id;
    let supplierName = "Unknown supplier";
    try {
      const container = await ContainerRepository.getContainerById(container_id);
      if (container) {
        barcode = container.barcode;
        supplierName = container.supplier.name;
      }
    } catch (logContextError) {
      logger(
        "UploadGeneratedFinalReportFilesController",
        logContextError,
        "warn",
      );
    }

    const activityPayload: LogFinalReportGenerationInput = {
      container_id,
      barcode,
      supplier_name: supplierName,
      action: "upload_generated_files",
      options: [],
      data: [
        { option: "Version", value: String(result.version) },
        {
          option: "Hidden previous files",
          value: String(result.hidden_files.length),
        },
      ],
      files: result.files.map((file) => ({
        variant:
          file.document_type === "FINAL_REPORT_ORIGINAL"
            ? "original"
            : "modified",
        container_file_id: file.container_file_id,
        version: file.version,
        filename: file.original_filename,
        size_bytes: file.size_bytes,
      })),
    };

    await logActivity(
      "CREATE",
      "container_file",
      result.files.map((file) => file.container_file_id).join(","),
      buildFinalReportGenerationLogDescription(activityPayload),
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
