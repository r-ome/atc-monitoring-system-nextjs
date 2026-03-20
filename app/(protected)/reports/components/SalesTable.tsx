"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./sales-columns";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { ExpenseRow } from "src/controllers/reports/get-total-expenses.controller";

type SalesInput = {
  key: string;
  label: string;
  total_bidders: number;
  total_items: number;
  total_sales: number;
  total_registration_fee: number;
};

export type SalesRowType = SalesInput & {
  total_expenses: number;
};

interface SalesTableProps {
  sales: SalesInput[];
  expenses: ExpenseRow[];
}

export const SalesTable = ({ sales, expenses }: SalesTableProps) => {
  const expenseMap = new Map(expenses.map((e) => [e.key, e.total_expenses]));

  // Merge expenses into sales rows by matching key
  const rows: SalesRowType[] = sales.map((s) => ({
    ...s,
    total_expenses: expenseMap.get(s.key) ?? 0,
  }));

  // Also add expense-only rows (days/months with expenses but no auctions)
  for (const expense of expenses) {
    if (!rows.some((r) => r.key === expense.key)) {
      rows.push({
        key: expense.key,
        label: expense.label,
        total_bidders: 0,
        total_items: 0,
        total_sales: 0,
        total_registration_fee: 0,
        total_expenses: expense.total_expenses,
      });
    }
  }

  rows.sort((a, b) => a.key.localeCompare(b.key));

  const totalSales = rows.reduce((acc, r) => acc + r.total_sales, 0);
  const totalRegistration = rows.reduce((acc, r) => acc + r.total_registration_fee, 0);
  const totalExpenses = rows.reduce((acc, r) => acc + r.total_expenses, 0);
  const netIncome = totalSales + totalRegistration - totalExpenses;

  return (
    <DataTable
      title={
        <div className="flex flex-col gap-2 w-fit">
          <div className="flex justify-between gap-8">
            <span>Total Sales:</span>
            <span className="text-green-500">{formatNumberToCurrency(totalSales)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Total Registration:</span>
            <span className="text-green-500">{formatNumberToCurrency(totalRegistration)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Total Expenses:</span>
            <span className="text-red-500">{formatNumberToCurrency(totalExpenses)}</span>
          </div>
          <div className="flex justify-between gap-8 border-t pt-2">
            <span>Net Income:</span>
            <span className={netIncome >= 0 ? "text-green-500" : "text-red-500"}>
              {formatNumberToCurrency(netIncome)}
            </span>
          </div>
        </div>
      }
      columns={columns}
      data={rows}
    />
  );
};
