"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { BiddersWithBirthdatesAndRecentAuctionSchema } from "src/entities/models/Bidder";

export const columns: ColumnDef<BiddersWithBirthdatesAndRecentAuctionSchema>[] =
  [
    {
      accessorKey: "bidder_number",
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
      header: ({ column }) => {
        return (
          <div className="flex justify-start">
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

        return <div className="flex justify-start">{bidder.first_name}</div>;
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
        return <div className="flex justify-center">{bidder.birthdate}</div>;
      },
    },
    {
      accessorKey: "age",
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
              Age
              <ArrowUpDown />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const bidder = row.original;
        return <div className="flex justify-center">{bidder.age}</div>;
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
