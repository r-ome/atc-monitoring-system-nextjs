import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { LogContainerReportInput, logContainerReportSchema } from "src/entities/models/Container";
import { err, ok } from "src/entities/models/Result";

const SHEET_LABELS: Record<LogContainerReportInput["sheets"][number], string> = {
  monitoring: "Monitoring",
  final_computation: "Final Computation",
  unsold: "Unsold",
  encode: "Encode",
  bill: "Bill",
  deductions: "Deductions",
};

export const LogContainerReportController = async (
  input: Record<string, unknown>,
) => {
  try {
    const { data, error: inputParseError } =
      logContainerReportSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const description = [
      `Generated container report for ${data.barcode} (${data.supplier_name})`,
      `Auction dates: ${data.selected_dates.join(", ")}`,
      `Remove Bidder 740: ${data.exclude_bidder_740 ? "Yes" : "No"}`,
      `Remove REFUNDED items from Bidder 5013: ${
        data.exclude_refunded_bidder_5013 ? "Yes" : "No"
      }`,
      `Less 30,000: ${data.deduct_thirty_k ? "Yes" : "No"}`,
      `Sheets: ${data.sheets.map((sheet) => SHEET_LABELS[sheet]).join(", ")}`,
    ].join(" | ");

    await logActivity(
      "CREATE",
      "container_report",
      data.container_id,
      description,
    );

    return ok({ success: true });
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("LogContainerReportController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("LogContainerReportController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
