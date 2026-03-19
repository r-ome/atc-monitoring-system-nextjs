"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { BannedBidder } from "src/entities/models/Statistics";

export const columns: ColumnDef<BannedBidder>[] = [
  {
    accessorKey: "bidder_number",
    size: 90,
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Bidder #
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.bidder_number}</div>
    ),
  },
  {
    accessorKey: "full_name",
    header: "Name",
  },
  {
    accessorKey: "branch_name",
    size: 100,
    header: ({ column }) => (
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
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.branch_name}</div>
    ),
  },
  {
    accessorKey: "remarks",
    header: "Reason",
    cell: ({ row }) =>
      row.original.remarks ? (
        <span className="truncate max-w-[200px] block">{row.original.remarks}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "banned_at",
    size: 130,
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Banned At
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.banned_at ?? <span className="text-muted-foreground">—</span>}
      </div>
    ),
  },
];
