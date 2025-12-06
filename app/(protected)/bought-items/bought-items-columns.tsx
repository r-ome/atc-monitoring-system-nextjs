"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { BoughtItems } from "src/entities/models/Inventory";
import { cn } from "@/app/lib/utils";

export const columns: ColumnDef<BoughtItems>[] = [
  {
    accessorKey: "barcode",
    size: 100,
    header: ({ column }) => {
      return (
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
      );
    },
    cell: ({ row }) => {
      const manifest = row.original;
      return <div className="flex justify-center"> {manifest.barcode}</div>;
    },
  },
  {
    accessorKey: "control",
    size: 100,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Control
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const manifest = row.original;
      return <div className="flex justify-center">{manifest.control}</div>;
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Description
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const manifest = row.original;
      return <div className="flex justify-center">{manifest.description}</div>;
    },
  },
  {
    accessorKey: "old_price",
    size: 100,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Old Price
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const boughtItem = row.original;
      return (
        <div className="flex justify-center">
          {boughtItem.old_price?.toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: "new_price",
    size: 100,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            New Price
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const boughtItem = row.original;
      return (
        <div
          className={cn(
            "flex justify-center",
            boughtItem.new_price && boughtItem.old_price
              ? boughtItem.new_price < boughtItem.old_price
                ? "text-red-500"
                : "text-green-500"
              : ""
          )}
        >
          {boughtItem.new_price?.toLocaleString()}
        </div>
      );
    },
  },
];
