"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { SalesRowType } from "./SalesTable";
import { formatDate, formatNumberToCurrency } from "@/app/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

function PeriodCell({ row }: { row: SalesRowType }) {
  if (row.paid_containers.length === 0) {
    return <div className="flex justify-center">{row.period}</div>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex justify-center">
          <span className="cursor-help underline decoration-dotted underline-offset-4">
            {row.period}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-none p-3 text-xs">
        {row.paid_containers.length === 1 ? (
          <div className="space-y-1">
            <p className="font-semibold">{row.paid_containers[0].barcode}</p>
            <p>Paid: {formatDate(row.paid_containers[0].paid_at)}</p>
            <p>
              Total Sales:{" "}
              {formatNumberToCurrency(row.paid_containers[0].total_item_sales)}
            </p>
            <p>
              Service Charge:{" "}
              {formatNumberToCurrency(
                row.paid_containers[0].total_service_charge,
              )}
            </p>
          </div>
        ) : (
          <table className="min-w-[32rem] border-collapse">
            <thead>
              <tr className="border-b border-primary-foreground/30">
                <th className="py-1 pr-3 text-left font-semibold">
                  Container Barcode
                </th>
                <th className="px-3 py-1 text-left font-semibold">Paid</th>
                <th className="px-3 py-1 text-right font-semibold">
                  Total Sales
                </th>
                <th className="py-1 pl-3 text-right font-semibold">
                  Service Charge
                </th>
              </tr>
            </thead>
            <tbody>
              {row.paid_containers.map((container) => (
                <tr
                  key={container.barcode}
                  className="border-b border-primary-foreground/15 last:border-0"
                >
                  <td className="py-1 pr-3">{container.barcode}</td>
                  <td className="px-3 py-1">{formatDate(container.paid_at, "MMM dd")}</td>
                  <td className="px-3 py-1 text-right tabular-nums">
                    {formatNumberToCurrency(container.total_item_sales)}
                  </td>
                  <td className="py-1 pl-3 text-right tabular-nums">
                    {formatNumberToCurrency(container.total_service_charge)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export const buildColumns = ({
  ownerSalesLabel,
}: {
  ownerSalesLabel: string;
}): ColumnDef<SalesRowType>[] => [
  {
    accessorKey: "period",
    size: 100,
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Period
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => <PeriodCell row={row.original} />,
  },
  {
    accessorKey: "sales_commission",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sales Comm.
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-success">
        {formatNumberToCurrency(row.original.sales_commission)}
      </div>
    ),
  },
  {
    accessorKey: "service_charge",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Service Charge
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-success">
        {formatNumberToCurrency(row.original.service_charge)}
      </div>
    ),
  },
  {
    accessorKey: "bought_items_profit_loss",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Bought Items
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div
        className={
          row.original.bought_items_profit_loss >= 0
            ? "flex justify-center text-status-success"
            : "flex justify-center text-status-error"
        }
      >
        {formatNumberToCurrency(row.original.bought_items_profit_loss)}
      </div>
    ),
  },
  {
    accessorKey: "owner_sales_00",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {ownerSalesLabel}
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-success">
        {formatNumberToCurrency(row.original.owner_sales_00)}
      </div>
    ),
  },
  {
    accessorKey: "sorting_preparation_fee",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Prep. Fee
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-success">
        {formatNumberToCurrency(row.original.sorting_preparation_fee)}
      </div>
    ),
  },
  {
    accessorKey: "expenses",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Expenses
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-error">
        {formatNumberToCurrency(row.original.expenses)}
      </div>
    ),
  },
  {
    accessorKey: "atc_group_commission",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Group Comm.
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-error">
        {formatNumberToCurrency(row.original.atc_group_commission)}
      </div>
    ),
  },
  {
    accessorKey: "royalty",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Royalty
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-error">
        {formatNumberToCurrency(row.original.royalty)}
      </div>
    ),
  },
  {
    accessorKey: "net_income",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Net Income
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={
              row.original.net_income >= 0
                ? "flex justify-center text-status-success"
                : "flex justify-center text-status-error"
            }
          >
            <span className="cursor-help underline decoration-dotted underline-offset-4">
              {formatNumberToCurrency(row.original.net_income)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="space-y-1 text-xs">
          <p>
            Total Income: {formatNumberToCurrency(row.original.total_income)}
          </p>
          <p>
            Total Expenses: {formatNumberToCurrency(row.original.total_expenses)}
          </p>
          <p className="border-t border-primary-foreground/30 pt-1 font-semibold">
            Net Income = Total Income - Total Expenses
          </p>
        </TooltipContent>
      </Tooltip>
    ),
  },
];
