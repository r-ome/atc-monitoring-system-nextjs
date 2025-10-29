"use client";

import { useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { generateReport } from "@/app/lib/reports";
import { Expense } from "src/entities/models/Expense";
import { Payment } from "src/entities/models/Payment";
import { formatDate } from "@/app/lib/utils";

interface GenerateExpenseReportProps {
  transactions: Payment[];
  expenses: Expense[];
  yesterdayBalance: number;
}

export const GenerateExpenseReport: React.FC<GenerateExpenseReportProps> = ({
  transactions,
  expenses,
  yesterdayBalance,
}) => {
  const { transaction_date }: { transaction_date: string } = useParams();
  return (
    <Button
      onClick={() => {
        generateReport(
          { payments: transactions, expenses, yesterdayBalance },
          ["cash_flow"],
          `Daily Cash Flow ${formatDate(
            new Date(transaction_date),
            "MMM dd, yyyy"
          )}`
        );
      }}
    >
      Generate Report
    </Button>
  );
};
