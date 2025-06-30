"use client";

import { useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { generateReport } from "@/app/lib/reports";
import { Expense } from "src/entities/models/Expense";
import { Payment } from "src/entities/models/Payment";
import { format } from "date-fns";

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
          `Daily Cash Flow ${format(transaction_date, "MMMM dd, yyyy")}`
        );
      }}
    >
      Generate Report
    </Button>
  );
};
