"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
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

  return (
    <DataTable
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
