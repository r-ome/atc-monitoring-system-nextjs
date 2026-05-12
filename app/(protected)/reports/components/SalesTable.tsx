"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { buildColumns } from "./sales-columns";
import { formatNumberToCurrency } from "@/app/lib/utils";
import {
  SalesExpensesSummary,
  SalesExpensesSummaryEntry,
} from "src/entities/models/Report";

export type SalesRowType = SalesExpensesSummaryEntry;

interface SalesTableProps {
  summary: SalesExpensesSummary;
  branchName: string;
}

export const SalesTable = ({ summary, branchName }: SalesTableProps) => {
  const ownerSalesLabel =
    branchName.toUpperCase() === "TARLAC" ? "T0 Sales" : "00 Sales";
  const columns = buildColumns({ ownerSalesLabel });
  return (
    <DataTable
      title={
        <div className="flex flex-wrap gap-8">
          <div className="flex flex-col gap-2 min-w-[260px]">
            <div className="font-semibold border-b pb-1">Income</div>
            <div className="flex justify-between gap-8">
              <span>Sales Commission:</span>
              <span className="text-green-500">{formatNumberToCurrency(summary.totals.sales_commission)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span>Service Charge:</span>
              <span className="text-green-500">{formatNumberToCurrency(summary.totals.service_charge)}</span>
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
              <span>{ownerSalesLabel}:</span>
              <span className="text-green-500">
                {formatNumberToCurrency(summary.totals.owner_sales_00)}
              </span>
            </div>
            <div className="flex justify-between gap-8">
              <span>Sorting / Preparation Fee:</span>
              <span className="text-green-500">
                {formatNumberToCurrency(summary.totals.sorting_preparation_fee)}
              </span>
            </div>
            <div className="flex justify-between gap-8 border-t pt-2 font-semibold">
              <span>Total:</span>
              <span className="text-green-500">
                {formatNumberToCurrency(summary.totals.total_income)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[260px]">
            <div className="font-semibold border-b pb-1">Expenses</div>
            <div className="flex justify-between gap-8">
              <span>Expenses:</span>
              <span className="text-red-500">{formatNumberToCurrency(summary.totals.expenses)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span>ATC Group Commission:</span>
              <span className="text-red-500">{formatNumberToCurrency(summary.totals.atc_group_commission)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span>Royalty:</span>
              <span className="text-red-500">{formatNumberToCurrency(summary.totals.royalty)}</span>
            </div>
            <div className="flex justify-between gap-8 border-t pt-2 font-semibold">
              <span>Total:</span>
              <span className="text-red-500">
                {formatNumberToCurrency(summary.totals.total_expenses)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[260px]">
            <div className="font-semibold border-b pb-1">Net Income</div>
            <div className="flex justify-between gap-8">
              <span>Gross Income:</span>
              <span className="text-green-500">
                {formatNumberToCurrency(summary.totals.total_income)}
              </span>
            </div>
            <div className="flex justify-between gap-8">
              <span>Gross Expenses:</span>
              <span className="text-red-500">
                {formatNumberToCurrency(summary.totals.total_expenses)}
              </span>
            </div>
            <div className="flex justify-between gap-8 border-t pt-2 font-semibold">
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
        </div>
      }
      columns={columns}
      data={summary.breakdown}
    />
  );
};
