"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef, Row } from "@tanstack/react-table";
import { CashFlowEntry } from "src/entities/models/Report";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";

const columns: ColumnDef<CashFlowEntry>[] = [
  {
    accessorKey: "date",
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
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.date}</div>
    ),
  },
  {
    accessorKey: "inflow_pull_out",
    header: () => <div className="text-center">Pull Out</div>,
    cell: ({ row }) => (
      <div className="flex justify-center text-green-500">
        {formatNumberToCurrency(row.original.inflow_pull_out)}
      </div>
    ),
  },
  {
    accessorKey: "inflow_add_on",
    header: () => <div className="text-center">Add On</div>,
    cell: ({ row }) => (
      <div className="flex justify-center text-green-500">
        {formatNumberToCurrency(row.original.inflow_add_on)}
      </div>
    ),
  },
  {
    accessorKey: "outflow_refunded",
    header: () => <div className="text-center">Refunded</div>,
    cell: ({ row }) => (
      <div className="flex justify-center text-red-500">
        {formatNumberToCurrency(row.original.outflow_refunded)}
      </div>
    ),
  },
  {
    accessorKey: "outflow_less",
    header: () => <div className="text-center">Less</div>,
    cell: ({ row }) => (
      <div className="flex justify-center text-red-500">
        {formatNumberToCurrency(row.original.outflow_less)}
      </div>
    ),
  },
  {
    accessorKey: "outflow_expenses",
    header: () => <div className="text-center">Expenses</div>,
    cell: ({ row }) => (
      <div className="flex justify-center text-red-500">
        {formatNumberToCurrency(row.original.outflow_expenses)}
      </div>
    ),
  },
  {
    accessorKey: "net",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Net
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const net = row.original.net;
      return (
        <div
          className={`flex justify-center font-semibold ${
            net >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {formatNumberToCurrency(net)}
        </div>
      );
    },
  },
];

interface Props {
  data: CashFlowEntry[];
}

export const DailyCashFlowTable = ({ data }: Props) => {
  const totalInflow = data.reduce(
    (sum, d) => sum + d.inflow_pull_out + d.inflow_add_on,
    0,
  );
  const totalOutflow = data.reduce(
    (sum, d) => sum + d.outflow_refunded + d.outflow_less + d.outflow_expenses,
    0,
  );
  const totalNet = totalInflow - totalOutflow;

  const renderMobileCard = (row: Row<CashFlowEntry>) => {
    const c = row.original;
    return (
      <div className="flex flex-col gap-1.5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold">{c.date}</span>
          <span
            className={`ml-auto font-mono text-[15px] font-bold ${c.net >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {formatNumberToCurrency(c.net)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pull Out</span>
            <span className="font-mono text-green-500">
              {formatNumberToCurrency(c.inflow_pull_out)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Refunded</span>
            <span className="font-mono text-red-500">
              {formatNumberToCurrency(c.outflow_refunded)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Add On</span>
            <span className="font-mono text-green-500">
              {formatNumberToCurrency(c.inflow_add_on)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Less</span>
            <span className="font-mono text-red-500">
              {formatNumberToCurrency(c.outflow_less)}
            </span>
          </div>
          <div className="col-span-2 flex justify-between">
            <span className="text-muted-foreground">Expenses</span>
            <span className="font-mono text-red-500">
              {formatNumberToCurrency(c.outflow_expenses)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataTable
      renderMobileCard={renderMobileCard}
      title={
        <div className="flex gap-6">
          <span>
            Inflows: <span className="text-green-500">{formatNumberToCurrency(totalInflow)}</span>
          </span>
          <span>
            Outflows: <span className="text-red-500">{formatNumberToCurrency(totalOutflow)}</span>
          </span>
          <span>
            Net:{" "}
            <span className={totalNet >= 0 ? "text-green-500" : "text-red-500"}>
              {formatNumberToCurrency(totalNet)}
            </span>
          </span>
        </div>
      }
      columns={columns}
      data={data}
    />
  );
};
