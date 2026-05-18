"use client";

import { CoreRow, Row } from "@tanstack/react-table";
import { Wallet } from "lucide-react";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { Card } from "@/app/components/ui/card";
import { buildColumns } from "./sales-columns";
import { formatNumberToCurrency } from "@/app/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
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

  const renderMobileCard = (row: Row<SalesExpensesSummaryEntry>) => {
    const r = row.original;
    return (
      <div className="flex flex-col gap-1 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold">{r.period}</span>
          <span
            className={`ml-auto font-mono text-[15px] font-bold ${r.net_income >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {formatNumberToCurrency(r.net_income)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Income</span>
            <span className="font-mono text-green-500">
              {formatNumberToCurrency(r.total_income)}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-help justify-between">
                <span className="text-muted-foreground underline decoration-dotted underline-offset-4">
                  Expenses
                </span>
                <span className="font-mono text-red-500">
                  {formatNumberToCurrency(r.total_expenses)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="space-y-1 text-xs">
              <p>Salaries: {formatNumberToCurrency(r.salaries)}</p>
              <p>Misc Expenses: {formatNumberToCurrency(r.expenses)}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:gap-8">
          <div className="flex flex-col gap-2 md:min-w-[260px]">
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
          <div className="flex flex-col gap-2 md:min-w-[260px]">
            <div className="font-semibold border-b pb-1">Expenses</div>
            <div className="flex justify-between gap-8">
              <span>Misc Expenses:</span>
              <span className="text-red-500">{formatNumberToCurrency(summary.totals.expenses)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span>Salaries:</span>
              <span className="text-red-500">{formatNumberToCurrency(summary.totals.salaries)}</span>
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
          <div className="flex flex-col gap-2 md:min-w-[260px]">
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
      </Card>

      <AuctionDataTable
        icon={Wallet}
        title="Sales & Expenses Summary"
        meta={`${summary.breakdown.length.toLocaleString()} entries`}
        rowLabel="period"
        columns={columns}
        data={summary.breakdown}
        renderMobileCard={renderMobileCard}
        searchFilter={{
          globalFilterFn: (
            row: CoreRow<SalesExpensesSummaryEntry>,
            _columnId?: string,
            filterValue?: string,
          ) => {
            const search = (filterValue ?? "").toLowerCase();
            return row.original.period.toLowerCase().includes(search);
          },
          searchComponentProps: {
            placeholder: "Search by period",
          },
        }}
      />
    </div>
  );
};
