"use client";

import { Button } from "@/app/components/ui/button";
import { generateReport } from "@/app/lib/reports";
import { ExpenseSummaryEntry, FilterMode } from "src/entities/models/Report";

interface GenerateExpensesSummaryReportProps {
  branchName: string;
  data: ExpenseSummaryEntry[];
  dateParam: string;
  mode: FilterMode;
}

function buildFilename(
  branchName: string,
  dateParam: string,
  mode: FilterMode,
) {
  return `Expenses Summary ${branchName} ${mode} ${dateParam}`;
}

export const GenerateExpensesSummaryReport = ({
  branchName,
  data,
  dateParam,
  mode,
}: GenerateExpensesSummaryReportProps) => {
  return (
    <Button
      onClick={() => {
        generateReport(
          { expensesSummary: data },
          ["expenses_summary"],
          buildFilename(branchName, dateParam, mode),
        );
      }}
    >
      Generate Report
    </Button>
  );
};
