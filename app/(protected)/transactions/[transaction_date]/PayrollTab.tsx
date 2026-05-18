"use client";

import { Row } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { Expense } from "src/entities/models/Expense";
import { DataTable } from "@/app/components/data-table/data-table";
import { payrollColumns } from "./components/payroll/payroll-columns";
import { formatNumberToCurrency } from "@/app/lib/utils";

interface PayrollTabProps {
  expenses: Expense[];
}

export const PayrollTab: React.FC<PayrollTabProps> = ({ expenses }) => {
  const salaries = expenses.filter((e) => e.purpose === "SALARY");
  const total = salaries.reduce((sum, e) => sum + e.amount, 0);

  const renderMobileCard = (row: Row<Expense>) => {
    const e = row.original;
    return (
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-[14px] font-semibold">
            {e.employee?.full_name ?? "—"}
          </span>
          {e.remarks ? (
            <span className="truncate text-[12.5px] text-muted-foreground">
              {e.remarks}
            </span>
          ) : null}
          <span className="text-[12px] text-muted-foreground">
            {e.created_at}
          </span>
        </div>
        <span className="shrink-0 font-mono text-[14px] font-semibold text-status-error">
          ({e.amount.toLocaleString()})
        </span>
      </div>
    );
  };

  return (
    <DataTable
      embedded={false}
      icon={Users}
      title="Salary Payouts"
      meta={`${salaries.length.toLocaleString()} ${salaries.length === 1 ? "payout" : "payouts"} · Total ${formatNumberToCurrency(total)}`}
      rowLabel="payout"
      columns={payrollColumns}
      data={salaries}
      renderMobileCard={renderMobileCard}
    />
  );
};
