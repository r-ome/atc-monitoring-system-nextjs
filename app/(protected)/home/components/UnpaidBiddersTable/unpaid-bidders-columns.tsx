"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { UnpaidBidders } from "src/entities/models/Statistics";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

export const columns: ColumnDef<UnpaidBidders>[] = [
  {
    accessorKey: "bidder_number",
    size: 80,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Bidder #
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const bidder = row.original;
      return (
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block ">{bidder.bidder_number}</span>
            </TooltipTrigger>
            <TooltipContent side="right">
              {bidder.first_name} {bidder.last_name}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "balance",
    size: 120,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Balance
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const bidder = row.original;

      return (
        <div className="flex justify-center text-red-500">
          {bidder.balance.toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: "items",
    size: 80,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Items
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const bidder = row.original;
      return <div className="flex justify-center">{bidder.items}</div>;
    },
  },
  {
    accessorKey: "auction_date",
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
      const bidder = row.original;
      return <div className="flex justify-center">{bidder.auction_date}</div>;
    },
  },
];
