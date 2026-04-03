"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { BranchBadge, StatusBadge } from "@/app/components/admin";
import { BidderRowType } from "./bidders-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

export const columns: ColumnDef<BidderRowType>[] = [
  {
    id: "branch_name",
    accessorKey: "branch.name",
    filterFn: "includesIn",
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
          <BranchBadge branch={bidder.branch.name} />
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
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue<string | null>(columnId);
      const b = rowB.getValue<string | null>(columnId);
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      return new Date(a).getTime() - new Date(b).getTime();
    },
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
    id: "last_active",
    accessorFn: (row) => row.last_active.auction,
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue<string | null>(columnId);
      const b = rowB.getValue<string | null>(columnId);
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      return new Date(a).getTime() - new Date(b).getTime();
    },
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
      const { duration, auction } = row.original.last_active;
      return (
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger>{duration ?? "Never"}</TooltipTrigger>
            <TooltipContent>
              Last Auction: {auction ?? "No auction history"}
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
          <StatusBadge
            variant={bidder.status === "ACTIVE" ? "active" : "inactive"}
          >
            {bidder.status}
          </StatusBadge>
        </div>
      );
    },
  },
];
