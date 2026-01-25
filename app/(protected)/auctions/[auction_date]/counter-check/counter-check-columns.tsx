"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/app/lib/utils";

import { CounterCheck } from "src/entities/models/CounterCheck";

export const columns = (): ColumnDef<CounterCheck>[] => [
  {
    accessorKey: "control",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Control #
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const counter_check = row.original;
      return <div className="flex justify-center">{counter_check.control}</div>;
    },
  },
  {
    accessorKey: "bidder_number",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Bidder
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const counter_check = row.original;
      return (
        <div
          className={cn(
            "flex justify-center",
            counter_check.bidder_number === "0000" ? "bg-red-500" : "",
          )}
        >
          {counter_check.bidder_number === "0000"
            ? "NO BIDDER"
            : counter_check.bidder_number}
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const counter_check = row.original;
      return (
        <div
          className={cn(
            "flex justify-center",
            counter_check.price ? "" : "bg-red-500",
          )}
        >
          {counter_check.price
            ? parseInt(counter_check.price).toLocaleString()
            : "NO PRICE"}
        </div>
      );
    },
  },
  {
    accessorKey: "page",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Page
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const counter_check = row.original;
      return <div className="flex justify-center">{counter_check.page}</div>;
    },
  },
  {
    accessorKey: "remarks",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Remarks
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const counter_check = row.original;
      return <div className="flex justify-center">{counter_check.remarks}</div>;
    },
  },
];
