import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { formatDate } from "@/app/lib/utils";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { logCashFlowReportSchema } from "src/entities/models/Report";
import { err, ok } from "src/entities/models/Result";

export const LogCashFlowReportController = async (
  input: Record<string, unknown>,
) => {
  try {
    const { data, error: inputParseError } =
      logCashFlowReportSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const reportDate = formatDate(new Date(data.date), "MMMM dd, yyyy");

    await logActivity(
      "CREATE",
      "cash_flow_report",
      data.date,
      `Generated daily cash flow report for ${reportDate}`,
    );

    return ok({ success: true });
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("LogCashFlowReportController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("LogCashFlowReportController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
