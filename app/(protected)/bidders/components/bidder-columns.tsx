"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { BidderRowType } from "./bidders-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

export const columns: ColumnDef<BidderRowType>[] = [
  {
    accessorKey: "branch.name",
    size: 80,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Branch
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const bidder = row.original;
      return (
        <div className="flex justify-center">
          <Badge
            variant={bidder.branch.name === "TARLAC" ? "success" : "warning"}
          >
            {bidder.branch.name}
          </Badge>
        </div>
      );
    },
  },
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
      return <div className="flex justify-center">{bidder.bidder_number}</div>;
    },
  },
  {
    accessorKey: "full_name",
    enableResizing: true,
    size: 170,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Full Name
          <ArrowUpDown />
        </Button>
      );
    },
  },

  {
    accessorKey: "birthdate",
    size: 100,
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer flex justify-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Birth Date
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const bidder = row.original;
      return <div className="flex justify-center">{bidder.birthdate}</div>;
    },
  },
  {
    accessorKey: "last_active.duration",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Active
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    size: 100,
    cell: ({ row }) => {
      const bidder = row.original;
      return (
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger>{bidder.last_active.duration}</TooltipTrigger>
            <TooltipContent>
              Last Auction: {bidder.last_active.auction}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    size: 100,
    cell: ({ row }) => {
      const bidder = row.original;
      return (
        <div className="flex justify-center">
          <Badge
            variant={bidder.status === "ACTIVE" ? "success" : "destructive"}
          >
            {bidder.status}
          </Badge>
        </div>
      );
    },
  },
];
