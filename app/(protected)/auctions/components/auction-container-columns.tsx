"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { formatNumberToCurrency } from "@/app/lib/utils";

export const columns: ColumnDef<{
  barcode: string;
  total_items: number;
  total_sale: number;
}>[] = [
  {
    accessorKey: "barcode",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Barcode
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const containerSummary = row.original;
      return (
        <div className="flex justify-center">{containerSummary.barcode}</div>
      );
    },
  },
  {
    accessorKey: "total_items",
    enableResizing: true,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Items
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const containerSummary = row.original;
      return (
        <div className="flex justify-center">
          {containerSummary.total_items}
        </div>
      );
    },
  },
  {
    accessorKey: "total_sale",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Sale
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const containerSummary = row.original;
      return (
        <div className="flex justify-center">
          {formatNumberToCurrency(containerSummary.total_sale)}
        </div>
      );
    },
  },
];
