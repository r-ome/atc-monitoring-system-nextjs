"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { BidderActivityEntry } from "src/entities/models/Report";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";

const columns: ColumnDef<BidderActivityEntry>[] = [
  {
    accessorKey: "bidder_number",
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
      <div className="flex justify-center font-medium">
        {row.original.bidder_number}
      </div>
    ),
  },
  {
    accessorKey: "full_name",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.full_name}</div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      const color =
        status === "ACTIVE"
          ? "text-green-500"
          : status === "BANNED"
            ? "text-red-500"
            : "text-yellow-500";
      return (
        <div className={`flex justify-center font-medium ${color}`}>
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "auctions_attended",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Auctions
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.auctions_attended}
      </div>
    ),
  },
  {
    accessorKey: "items_won",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Items Won
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.items_won}</div>
    ),
  },
  {
    accessorKey: "total_spent",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Spent
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-green-500">
        {formatNumberToCurrency(row.original.total_spent)}
      </div>
    ),
  },
];

interface Props {
  data: BidderActivityEntry[];
}

export const BidderActivityTable = ({ data }: Props) => {
  const totalBidders = data.length;
  const totalSpent = data.reduce((sum, d) => sum + d.total_spent, 0);

  return (
    <DataTable
      title={
        <div className="flex gap-6">
          <span>
            Active Bidders: <span className="font-semibold">{totalBidders}</span>
          </span>
          <span>
            Total Spent:{" "}
            <span className="text-green-500">
              {formatNumberToCurrency(totalSpent)}
            </span>
          </span>
        </div>
      }
      columns={columns}
      data={data}
    />
  );
};
