"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./sales-columns";
import { formatNumberToCurrency } from "@/app/lib/utils";
import {
  SalesExpensesSummary,
  SalesExpensesSummaryEntry,
} from "src/entities/models/Report";

export type SalesRowType = SalesExpensesSummaryEntry;

interface SalesTableProps {
  summary: SalesExpensesSummary;
}

export const SalesTable = ({ summary }: SalesTableProps) => {
  return (
    <DataTable
      title={
        <div className="flex flex-col gap-2 w-fit">
          <div className="flex justify-between gap-8">
            <span>Total Income:</span>
            <span className="text-green-500">
              {formatNumberToCurrency(summary.totals.total_income)}
            </span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Sales Commission:</span>
            <span>{formatNumberToCurrency(summary.totals.sales_commission)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Service Charge:</span>
            <span>{formatNumberToCurrency(summary.totals.service_charge)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Bought Items:</span>
            <span
              className={
                summary.totals.bought_items_profit_loss >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }
            >
              {formatNumberToCurrency(summary.totals.bought_items_profit_loss)}
            </span>
          </div>
          <div className="flex justify-between gap-8">
            <span>00 Sales:</span>
            <span className="text-green-500">
              {formatNumberToCurrency(summary.totals.owner_sales_00)}
            </span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Sorting / Preparation Fee:</span>
            <span>
              {formatNumberToCurrency(summary.totals.sorting_preparation_fee)}
            </span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Total Expenses:</span>
            <span className="text-red-500">
              {formatNumberToCurrency(summary.totals.total_expenses)}
            </span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Expenses:</span>
            <span>{formatNumberToCurrency(summary.totals.expenses)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span>ATC Group Commission:</span>
            <span>{formatNumberToCurrency(summary.totals.atc_group_commission)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Royalty:</span>
            <span>{formatNumberToCurrency(summary.totals.royalty)}</span>
          </div>
          <div className="flex justify-between gap-8 border-t pt-2">
            <span>Net Income:</span>
            <span
              className={
                summary.totals.net_income >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }
            >
              {formatNumberToCurrency(summary.totals.net_income)}
            </span>
          </div>
        </div>
      }
      columns={columns}
      data={summary.breakdown}
    />
  );
};
