"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef, Row } from "@tanstack/react-table";
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

  const renderMobileCard = (row: Row<BidderActivityEntry>) => {
    const b = row.original;
    const statusColor =
      b.status === "ACTIVE"
        ? "text-green-500"
        : b.status === "BANNED"
          ? "text-red-500"
          : "text-yellow-500";
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[13px] font-semibold text-muted-foreground">
              #{b.bidder_number}
            </span>
            <span className="truncate text-[15px] font-medium">
              {b.full_name}
            </span>
          </div>
          <span className="text-[13px] text-muted-foreground">
            <span className={`font-semibold ${statusColor}`}>{b.status}</span> ·{" "}
            {b.auctions_attended} auction
            {b.auctions_attended === 1 ? "" : "s"} · {b.items_won} item
            {b.items_won === 1 ? "" : "s"}
          </span>
        </div>
        <span className="font-mono text-[14.5px] font-bold text-green-500">
          {formatNumberToCurrency(b.total_spent)}
        </span>
      </div>
    );
  };

  return (
    <DataTable
      renderMobileCard={renderMobileCard}
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
