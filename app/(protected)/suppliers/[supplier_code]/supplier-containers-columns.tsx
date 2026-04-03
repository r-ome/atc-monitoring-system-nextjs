"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { BranchBadge } from "@/app/components/admin";
import { ArrowUpDown } from "lucide-react";
import { formatDate } from "@/app/lib/utils";
import { SupplierContainerRow } from "./SupplierContainersTable";

export const supplierContainerColumns: ColumnDef<SupplierContainerRow>[] = [
  {
    accessorKey: "barcode",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Barcode
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.barcode}</div>
    ),
  },
  {
    accessorKey: "inventories",
    header: () => <div className="flex justify-center">Number of Items</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.inventories.length} items
      </div>
    ),
  },
  {
    accessorKey: "sold_items",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          SOLD Items
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.sold_items}</div>
    ),
  },
  {
    accessorKey: "unsold_items",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          UNSOLD Items
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.unsold_items}</div>
    ),
  },
  {
    accessorKey: "branch.name",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Branch
          <ArrowUpDown />
        </Button>
      </div>
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
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Arrival Date
          <ArrowUpDown />
        </Button>
      </div>
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
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due Date
          <ArrowUpDown />
        </Button>
      </div>
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
