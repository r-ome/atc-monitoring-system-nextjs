"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { AuctionsStatistics } from "src/entities/models/Statistics";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { Badge } from "@/app/components/ui/badge";

export const columns: ColumnDef<AuctionsStatistics>[] = [
  {
    accessorKey: "auction_date",
    size: 100,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
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
    accessorKey: "registered_bidders",
    size: 100,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Bidders
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction = row.original;
      const registeredBidders = auction.total_registered_bidders - 1;

      return (
        <div className="flex justify-center">
          {auction.total_bidders_with_balance === 0 ? (
            <Badge variant="success">FULLY PAID ({registeredBidders})</Badge>
          ) : (
            <div className="flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block justify-center ">
                    {auction.total_bidders_with_balance} / {registeredBidders}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {auction.total_bidders_with_balance} UNPAID bidders out of{" "}
                  {registeredBidders}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "total_items",
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
      const auction = row.original;
      return <div className="flex justify-center">{auction.total_items}</div>;
    },
  },
  {
    accessorKey: "total_cancelled_items",
    size: 80,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cancelled
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction = row.original;
      return (
        <div className="flex justify-center">
          {auction.total_cancelled_items}
        </div>
      );
    },
  },
  {
    accessorKey: "total_refunded_items",
    size: 80,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Refunded
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction = row.original;
      return (
        <div className="flex justify-center">
          {auction.total_refunded_items}
        </div>
      );
    },
  },
  {
    accessorKey: "container_barcodes",
    header: () => {
      return <div className="flex justify-center">Containers</div>;
    },
    cell: ({ row }) => {
      const auction = row.original;
      return (
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block truncate ">
                {auction.container_barcodes}
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              {auction.container_barcodes}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];
