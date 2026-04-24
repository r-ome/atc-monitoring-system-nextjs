"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ContainerStatusEntry } from "src/entities/models/Report";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { parse } from "date-fns";

const parseReportDate = (value: string | null) =>
  value ? parse(value, "MMM dd, yyyy", new Date()).getTime() : 0;

const columns: ColumnDef<ContainerStatusEntry>[] = [
  {
    accessorKey: "barcode",
    header: () => <div>Barcode</div>,
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.original.barcode}</div>
    ),
  },
  {
    accessorKey: "container_number",
    header: () => <div>Container #</div>,
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.original.container_number ?? "—"}
      </div>
    ),
  },
  {
    accessorKey: "supplier_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Supplier <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="truncate">{row.original.supplier_name}</div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const isPaid = row.original.status === "PAID";
      return (
        <div
          className={`flex justify-center font-semibold ${isPaid ? "text-green-500" : "text-red-500"}`}
        >
          {row.original.status}
        </div>
      );
    },
  },
  {
    accessorKey: "arrival_date",
    sortingFn: (rowA, rowB) =>
      parseReportDate(rowA.original.arrival_date) -
      parseReportDate(rowB.original.arrival_date),
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Arrival Date <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-muted-foreground">
        {row.original.arrival_date ?? "—"}
      </div>
    ),
  },
  {
    accessorKey: "due_date",
    sortingFn: (rowA, rowB) =>
      parseReportDate(rowA.original.due_date) -
      parseReportDate(rowB.original.due_date),
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due Date <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-muted-foreground">
        {row.original.due_date ?? "—"}
      </div>
    ),
  },
  {
    accessorKey: "days_since_arrival",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Days Aging <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const days = row.original.days_since_arrival;
      if (days === null)
        return (
          <div className="flex justify-center text-muted-foreground">—</div>
        );
      const color =
        days > 60
          ? "text-red-500"
          : days > 30
            ? "text-yellow-500"
            : "text-muted-foreground";
      return (
        <div className={`flex justify-center font-semibold ${color}`}>
          {days}d
        </div>
      );
    },
  },
  {
    accessorKey: "duties_and_taxes",
    header: () => <div className="text-center">Duties & Taxes</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.duties_and_taxes > 0
          ? formatNumberToCurrency(row.original.duties_and_taxes)
          : "—"}
      </div>
    ),
  },
  {
    accessorKey: "total_items",
    header: () => <div className="text-center">Total Items</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.total_items}</div>
    ),
  },
  {
    accessorKey: "paid_items",
    header: () => <div className="text-center">Paid Items</div>,
    cell: ({ row }) => (
      <div className="flex justify-center text-green-500">
        {row.original.paid_items}
      </div>
    ),
  },
];

interface Props {
  data: ContainerStatusEntry[];
}

export const ContainerStatusTable = ({ data }: Props) => {
  const total = data.length;
  const paid = data.filter((d) => d.status === "PAID").length;
  const unpaid = data.filter((d) => d.status === "UNPAID").length;

  return (
    <DataTable
      title={
        <div className="flex gap-6">
          <span>
            Total: <span className="font-semibold">{total}</span>
          </span>
          <span>
            Paid: <span className="text-green-500 font-semibold">{paid}</span>
          </span>
          <span>
            Unpaid: <span className="text-red-500 font-semibold">{unpaid}</span>
          </span>
        </div>
      }
      columns={columns}
      data={data}
      initialSorting={[{ id: "due_date", desc: false }]}
    />
  );
};
