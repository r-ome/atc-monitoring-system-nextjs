"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { BranchBadge } from "@/app/components/admin";
import { ArrowUpDown } from "lucide-react";
import { formatDate } from "@/app/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { SupplierContainerRow } from "./SupplierContainersTable";

function formatPeso(value: number): string {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function SortableHeader({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-center">
      <Button variant="ghost" className="cursor-pointer" onClick={onClick}>
        {label}
        <ArrowUpDown />
      </Button>
    </div>
  );
}

export const supplierContainerColumns: ColumnDef<SupplierContainerRow>[] = [
  {
    accessorKey: "barcode",
    header: ({ column }) => (
      <SortableHeader
        label="Barcode"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.barcode}</div>
    ),
  },
  {
    accessorKey: "total_item_sales",
    header: ({ column }) => (
      <SortableHeader
        label="Item Sales"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const { total_item_sales, sold_items, unsold_items } = row.original;
      return (
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help text-green-600 font-medium underline decoration-dotted">
                {formatPeso(total_item_sales)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="flex flex-col gap-0.5 text-xs">
                <span>Sold: {sold_items}</span>
                <span>Unsold: {unsold_items}</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "container_sales_commission",
    header: ({ column }) => (
      <SortableHeader
        label="Sales Comm."
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-orange-500">
        {formatPeso(row.original.container_sales_commission)}
      </div>
    ),
  },
  {
    accessorKey: "atc_group_commission",
    header: ({ column }) => (
      <SortableHeader
        label="Group Comm."
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-orange-500">
        {formatPeso(row.original.atc_group_commission)}
      </div>
    ),
  },
  {
    accessorKey: "preparation_fee",
    header: ({ column }) => (
      <SortableHeader
        label="Prep. Fee"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-orange-500">
        {formatPeso(row.original.preparation_fee)}
      </div>
    ),
  },
  {
    accessorKey: "royalty",
    header: ({ column }) => (
      <SortableHeader
        label="Royalty"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-orange-500">
        {formatPeso(row.original.royalty)}
      </div>
    ),
  },
  {
    accessorKey: "atc_sales",
    header: ({ column }) => (
      <SortableHeader
        label="ATC Sales"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const val = row.original.atc_sales;
      return (
        <div
          className={`flex justify-center font-medium ${val >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          {formatPeso(val)}
        </div>
      );
    },
  },
  {
    accessorKey: "branch.name",
    header: ({ column }) => (
      <SortableHeader
        label="Branch"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <BranchBadge branch={row.original.branch.name} />
      </div>
    ),
  },
  {
    accessorKey: "arrival_date",
    header: ({ column }) => (
      <SortableHeader
        label="Arrival"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.arrival_date
          ? formatDate(row.original.arrival_date, "MMM dd, yyyy")
          : "N/A"}
      </div>
    ),
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => (
      <SortableHeader
        label="Due Date"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.due_date
          ? formatDate(row.original.due_date, "MMM dd, yyyy")
          : "N/A"}
      </div>
    ),
  },
];
