"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef, Row } from "@tanstack/react-table";
import { UnpaidBidderEntry } from "src/entities/models/Report";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";

const columns: ColumnDef<UnpaidBidderEntry>[] = [
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
    accessorKey: "auctions_with_balance",
    header: () => <div className="text-center">Auctions w/ Balance</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.auctions_with_balance}
      </div>
    ),
  },
  {
    accessorKey: "total_balance",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Balance
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-red-500 font-semibold">
        {formatNumberToCurrency(row.original.total_balance)}
      </div>
    ),
  },
];

interface Props {
  data: UnpaidBidderEntry[];
}

export const UnpaidBiddersTable = ({ data }: Props) => {
  const totalBalance = data.reduce((sum, d) => sum + d.total_balance, 0);

  const renderMobileCard = (row: Row<UnpaidBidderEntry>) => {
    const b = row.original;
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="font-mono text-[12px] font-semibold text-muted-foreground">
          #{b.bidder_number}
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[13px] font-medium">{b.full_name}</span>
          <span className="text-[11px] text-muted-foreground">
            {b.auctions_with_balance} auction
            {b.auctions_with_balance === 1 ? "" : "s"} w/ balance
          </span>
        </div>
        <span className="font-mono text-[12.5px] font-bold text-red-500">
          {formatNumberToCurrency(b.total_balance)}
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
            Unpaid Bidders: <span className="font-semibold">{data.length}</span>
          </span>
          <span>
            Total Outstanding:{" "}
            <span className="text-red-500">
              {formatNumberToCurrency(totalBalance)}
            </span>
          </span>
        </div>
      }
      columns={columns}
      data={data}
    />
  );
};
