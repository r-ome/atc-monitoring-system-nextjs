import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  LogFinalReportGenerationInput,
  logFinalReportGenerationSchema,
} from "src/entities/models/Container";
import { err, ok } from "src/entities/models/Result";

const FINAL_REPORT_ACTION_SUMMARY: Record<
  LogFinalReportGenerationInput["action"],
  string
> = {
  preview_original: "Generated original final report preview",
  preview_modified: "Generated modified final report preview",
  finalize: "Finalized final report",
  upload_generated_files: "Uploaded generated final report files",
};

export function buildFinalReportGenerationLogDescription(
  data: LogFinalReportGenerationInput,
) {
  const summary = `${FINAL_REPORT_ACTION_SUMMARY[data.action]} for ${data.barcode} (${data.supplier_name})`;

  return JSON.stringify({
    type: "final_report_generated",
    action: data.action,
    summary,
    barcode: data.barcode,
    supplier_name: data.supplier_name,
    workbook_variant: data.workbook_variant ?? null,
    options: data.options,
    data: data.data,
    files: data.files,
  });
}

export const LogFinalReportGenerationController = async (
  input: Record<string, unknown>,
) => {
  try {
    const { data, error: inputParseError } =
      logFinalReportGenerationSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    await logActivity(
      data.action === "finalize" ? "UPDATE" : "CREATE",
      "final_report",
      data.container_id,
      buildFinalReportGenerationLogDescription(data),
    );

    return ok({ success: true });
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("LogFinalReportGenerationController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("LogFinalReportGenerationController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
