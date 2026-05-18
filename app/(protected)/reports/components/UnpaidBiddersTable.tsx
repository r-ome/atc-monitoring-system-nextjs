"use client";

import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { ColumnDef, CoreRow, Row } from "@tanstack/react-table";
import { UnpaidBidderEntry } from "src/entities/models/Report";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown, HandCoins } from "lucide-react";

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
        <span className="font-mono text-[14px] font-semibold text-muted-foreground">
          #{b.bidder_number}
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[15px] font-medium">{b.full_name}</span>
          <span className="text-[13px] text-muted-foreground">
            {b.auctions_with_balance} auction
            {b.auctions_with_balance === 1 ? "" : "s"} w/ balance
          </span>
        </div>
        <span className="font-mono text-[14.5px] font-bold text-red-500">
          {formatNumberToCurrency(b.total_balance)}
        </span>
      </div>
    );
  };

  return (
    <AuctionDataTable
      icon={HandCoins}
      title="Unpaid Bidders"
      meta={
        <span>
          {data.length.toLocaleString()} bidder{data.length === 1 ? "" : "s"} ·{" "}
          <span className="text-red-500 font-semibold">
            {formatNumberToCurrency(totalBalance)}
          </span>{" "}
          outstanding
        </span>
      }
      rowLabel="bidder"
      renderMobileCard={renderMobileCard}
      columns={columns}
      data={data}
      searchFilter={{
        globalFilterFn: (
          row: CoreRow<UnpaidBidderEntry>,
          _columnId?: string,
          filterValue?: string,
        ) => {
          const search = (filterValue ?? "").toLowerCase();
          const { bidder_number, full_name } = row.original;
          return [bidder_number, full_name]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(search));
        },
        searchComponentProps: {
          placeholder: "Search By Name or Bidder Number",
        },
      }}
    />
  );
};
