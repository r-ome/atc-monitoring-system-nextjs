"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { SupplierRowType } from "./suppliers-table";

export const columns: ColumnDef<SupplierRowType>[] = [
  {
    accessorKey: "name",
    size: 300,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Supplier Name
          <ArrowUpDown />
        </Button>
      );
    },
  },
  {
    accessorKey: "supplier_code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Supplier Code
          <ArrowUpDown />
        </Button>
      );
    },
  },
  {
    accessorKey: "japanese_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Japanese Name
          <ArrowUpDown />
        </Button>
      );
    },
  },
];
