"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { SalesRowType } from "./SalesTable";
import { formatNumberToCurrency } from "@/app/lib/utils";

export const columns: ColumnDef<SalesRowType>[] = [
  {
    accessorKey: "auction_date",
    size: 100,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Auction Date
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction = row.original;
      return <div className="flex justify-center">{auction.auction_date}</div>;
    },
  },
  {
    accessorKey: "total_sales",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Sales
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction = row.original;

      return (
        <div className="flex justify-center">
          {formatNumberToCurrency(auction.total_sales)}
        </div>
      );
    },
  },
  {
    accessorKey: "total_registration_fee",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Registration Fee
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction = row.original;
      return (
        <div className="flex justify-center">
          {formatNumberToCurrency(auction.total_registration_fee)}
        </div>
      );
    },
  },
  {
    accessorKey: "total_bidders",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Bidders
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction = row.original;
      return <div className="flex justify-center">{auction.total_bidders}</div>;
    },
  },
  {
    accessorKey: "total_items",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Items
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction = row.original;
      return <div className="flex justify-center">{auction.total_items}</div>;
    },
  },
];
