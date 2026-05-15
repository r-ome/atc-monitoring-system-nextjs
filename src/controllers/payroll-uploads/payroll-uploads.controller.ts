import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { ok, err } from "src/entities/models/Result";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  getPayrollRegularSheetData,
  VALID_FILE_TYPES,
  type PayrollSheetRow,
} from "@/app/lib/sheets";
import {
  previewRegularUploadUseCase,
  confirmRegularUploadUseCase,
} from "src/application/use-cases/payroll-uploads";
import type { RegularUploadRowInput } from "src/application/payroll/upload-regular-pipeline";
import type { BulkUpsertUploadRow } from "src/application/repositories/payroll-entries.repository.interface";

const isValidFile = (file: File) => VALID_FILE_TYPES.includes(file.type);

export const PreviewRegularUploadController = async (formData: FormData) => {
  try {
    const file = formData.get("file") as File | null;
    const payroll_period_id = String(formData.get("payroll_period_id") ?? "");
    if (!file) throw new InputParseError("Missing file");
    if (!isValidFile(file)) {
      throw new InputParseError("Invalid file type", {
        cause: { file: ["Please upload an .xlsx, .xls, or Numbers file."] },
      });
    }
    if (!payroll_period_id) throw new InputParseError("Missing payroll_period_id");

    const buffer = await file.arrayBuffer();
    const sheet = getPayrollRegularSheetData(buffer);
    const rows: RegularUploadRowInput[] = sheet.data.map((r: PayrollSheetRow) => ({ ...r }));

    const result = await previewRegularUploadUseCase(payroll_period_id, rows);
    return ok(result);
  } catch (error) {
    logger("PreviewRegularUploadController", error);
    if (error instanceof InputParseError) return err({ message: error.message, cause: error.cause });
    if (error instanceof NotFoundError) return err({ message: error.message, cause: error.cause });
    return err({ message: "Server Error", cause: "Failed to preview regular sheet upload" });
  }
};

export const RevalidateRegularUploadController = async (
  payroll_period_id: string,
  rows: RegularUploadRowInput[],
) => {
  try {
    if (!payroll_period_id) throw new InputParseError("Missing payroll_period_id");
    const result = await previewRegularUploadUseCase(payroll_period_id, rows);
    return ok(result);
  } catch (error) {
    logger("RevalidateRegularUploadController", error);
    if (error instanceof InputParseError) return err({ message: error.message, cause: error.cause });
    if (error instanceof NotFoundError) return err({ message: error.message, cause: error.cause });
    return err({ message: "Server Error", cause: "Failed to revalidate" });
  }
};

export const ConfirmRegularUploadController = async (
  payroll_period_id: string,
  rows: BulkUpsertUploadRow[],
) => {
  const ctx = RequestContext.getStore();
  try {
    if (!payroll_period_id) throw new InputParseError("Missing payroll_period_id");
    if (!rows.length) throw new InputParseError("No valid rows to apply");

    const entries = await confirmRegularUploadUseCase(payroll_period_id, rows);
    logger(
      "ConfirmRegularUploadController",
      { payroll_period_id, count: entries.length, username: ctx?.username },
      "info",
    );
    await logActivity(
      "CREATE",
      "payroll_entry",
      payroll_period_id,
      `Bulk uploaded ${entries.length} regular payroll entries`,
    );
    return ok({ count: entries.length });
  } catch (error) {
    logger("ConfirmRegularUploadController", error);
    if (error instanceof InputParseError) return err({ message: error.message, cause: error.cause });
    if (error instanceof NotFoundError) return err({ message: error.message, cause: error.cause });
    if (error instanceof DatabaseOperationError) return err({ message: error.message, cause: error.cause });
    return err({ message: "Server Error", cause: "Failed to apply regular sheet upload" });
  }
};
