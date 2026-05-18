"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef, Row } from "@tanstack/react-table";
import { TopBidderEntry } from "src/entities/models/Report";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";

const columns: ColumnDef<TopBidderEntry>[] = [
  {
    id: "rank",
    header: () => <div className="text-center">#</div>,
    cell: ({ row }) => (
      <div className="flex justify-center font-semibold">{row.index + 1}</div>
    ),
  },
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
      <div className="flex justify-center text-green-500 font-semibold">
        {formatNumberToCurrency(row.original.total_spent)}
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
];

interface Props {
  data: TopBidderEntry[];
}

export const TopBiddersTable = ({ data }: Props) => {
  const renderMobileCard = (row: Row<TopBidderEntry>) => {
    const b = row.original;
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-bold text-accent-foreground">
          {row.index + 1}
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[15px] font-medium">{b.full_name}</span>
          <span className="text-[13px] text-muted-foreground">
            #{b.bidder_number} · {b.items_won} item
            {b.items_won === 1 ? "" : "s"} · {b.auctions_attended} auction
            {b.auctions_attended === 1 ? "" : "s"}
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
      title={
        <span>
          Top {data.length} Bidders by Total Spend
        </span>
      }
      columns={columns}
      data={data}
      renderMobileCard={renderMobileCard}
    />
  );
};
