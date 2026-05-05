import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { logContainerReportSchema } from "src/entities/models/Container";
import { err, ok } from "src/entities/models/Result";

function buildContainerReportLogDescription(options: {
  summary: string;
  rows: { option: string; value: string }[];
}) {
  return JSON.stringify({
    type: "container_report",
    summary: options.summary,
    options: options.rows,
  });
}

export const LogContainerReportController = async (
  input: Record<string, unknown>,
) => {
  try {
    const ctx = RequestContext.getStore();
    const { data, error: inputParseError } =
      logContainerReportSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const summary = `Generated container report for ${data.barcode} (${data.supplier_name})`;
    const options = [
      {
        option: "Auction dates",
        value: data.selected_dates.join(", "),
      },
      {
        option: "Remove REFUNDED items from Bidder 5013",
        value: data.exclude_refunded_bidder_5013 ? "Yes" : "No",
      },
      {
        option: "Less 30,000",
        value: data.deduct_thirty_k ? "Yes" : "No",
      },
    ];

    if (ctx?.branch_name !== "TARLAC") {
      options.splice(
        2,
        0,
        {
          option: "Remove Bidder 740",
          value: data.exclude_bidder_740 ? "Yes" : "No",
        },
      );
    }

    const description = buildContainerReportLogDescription({
      summary,
      rows: options,
    });

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
