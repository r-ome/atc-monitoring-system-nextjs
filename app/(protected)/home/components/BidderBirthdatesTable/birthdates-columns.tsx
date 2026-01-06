"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { BiddersWithBirthdatesAndRecentAuctionSchema } from "src/entities/models/Bidder";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

export const columns: ColumnDef<BiddersWithBirthdatesAndRecentAuctionSchema>[] =
  [
    {
      accessorKey: "bidder_number",
      size: 80,
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              className="cursor-pointer flex justify-center"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
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
          <div className="flex justify-center">{bidder.bidder_number}</div>
        );
      },
    },
    {
      accessorKey: "full_name",
      size: 120,
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Name
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
                <span className="inline-block">{bidder.first_name}</span>
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
      accessorKey: "birthdate",
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Birth Date
              <ArrowUpDown />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const bidder = row.original;
        return (
          <div className="flex justify-center">
            {bidder.birthdate} ({bidder.age} y/o)
          </div>
        );
      },
    },
    {
      accessorKey: "last_auction_date",
      header: ({ column }) => {
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              className="cursor-pointer"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Last Auction
              <ArrowUpDown />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const bidder = row.original;
        return (
          <div className="flex justify-center">{bidder.last_auction_date}</div>
        );
      },
    },
  ];
