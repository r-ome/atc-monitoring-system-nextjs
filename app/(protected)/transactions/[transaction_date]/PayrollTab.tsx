"use client";

import { Expense } from "src/entities/models/Expense";
import { DataTable } from "@/app/components/data-table/data-table";
import { payrollColumns } from "./components/payroll/payroll-columns";
import { formatNumberToCurrency } from "@/app/lib/utils";

interface PayrollTabProps {
  expenses: Expense[];
  selectedBranch: { branch_id: string } | null;
}

export const PayrollTab: React.FC<PayrollTabProps> = ({
  expenses,
  selectedBranch,
}) => {
  const salaries = expenses.filter((e) => e.purpose === "SALARY");
  const total = salaries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {salaries.length} salary payout{salaries.length !== 1 ? "s" : ""} for this day
        </p>
        <p className="text-sm font-semibold">
          Total: <span className="text-status-error">({formatNumberToCurrency(total)})</span>
        </p>
      </div>
      <DataTable columns={payrollColumns} data={salaries} />
    </div>
  );
};
