"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { SupplierRowType } from "./suppliers-table";

export const columns: ColumnDef<SupplierRowType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Supplier Name
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-end">{row.original.name}</div>
    ),
  },
  {
    accessorKey: "supplier_code",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Supplier Code
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.supplier_code}</div>
    ),
  },
  {
    accessorKey: "japanese_name",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Japanese Name
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.japanese_name}</div>
    ),
  },
  {
    accessorKey: "container_count",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Containers
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.container_count}</div>
    ),
  },
];
