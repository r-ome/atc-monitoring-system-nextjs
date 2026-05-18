"use client";

import { useRouter } from "next/navigation";
import { ColumnDef, Row } from "@tanstack/react-table";
import { DataTable } from "@/app/components/data-table/data-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown, Gavel } from "lucide-react";
type AuctionsJoinedRowType = {
  auction_bidder_id: string;
  auction_id: string;
  auction_date: string;
  created_at: string;
  service_charge: number;
  registration_fee: number;
  balance: number;
  total_paid: number;
  total_items: number;
};

interface AuctionsJoinedProps {
  bidderNumber: string;
  auctionsJoined: AuctionsJoinedRowType[];
}

const columns: ColumnDef<AuctionsJoinedRowType>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Auction Date
        <ArrowUpDown />
      </Button>
    ),
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.original.auction_date;
      const b = rowB.original.auction_date;
      return new Date(a).getTime() - new Date(b).getTime();
    },
  },
  {
    accessorKey: "service_charge",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Service Charge
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.service_charge}%</div>
    ),
  },
  {
    accessorKey: "registration_fee",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Registration Fee
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        ₱{row.original.registration_fee.toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "total_paid",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Paid
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        ₱{row.original.total_paid.toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "balance",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Balance
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        ₱{row.original.balance.toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "total_items",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Items
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.total_items}</div>
    ),
  },
];

const AuctionsJoined = ({ auctionsJoined, bidderNumber }: AuctionsJoinedProps) => {
  const router = useRouter();

  const grandTotal = auctionsJoined.reduce((sum, row) => sum + row.total_paid, 0);

  const renderMobileCard = (row: Row<AuctionsJoinedRowType>) => {
    const r = row.original;
    return (
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-[13.5px] font-semibold">
              {r.auction_date}
            </span>
            <span className="text-[12px] text-muted-foreground">
              {r.total_items} items · {r.service_charge}%
            </span>
          </div>
          <span className="text-[12.5px] text-muted-foreground">
            Reg ₱{r.registration_fee.toLocaleString()} · Paid ₱
            {r.total_paid.toLocaleString()}
          </span>
        </div>
        <span
          className={
            "shrink-0 font-mono text-[13.5px] font-semibold " +
            (r.balance > 0 ? "text-destructive" : "text-status-success")
          }
        >
          ₱{r.balance.toLocaleString()}
        </span>
      </div>
    );
  };

  return (
    <DataTable
      embedded={false}
      icon={Gavel}
      title="Auctions Joined"
      meta={`${auctionsJoined.length.toLocaleString()} entries`}
      rowLabel="auction"
      columns={columns}
      data={auctionsJoined}
      onRowClick={(row) =>
        router.push(`/auctions/${row.auction_date}/registered-bidders/${bidderNumber}`)
      }
      renderMobileCard={renderMobileCard}
      footer={
        <div className="flex justify-end text-sm font-semibold pr-2">
          Total Paid: ₱{grandTotal.toLocaleString()}
        </div>
      }
    />
  );
};

export default AuctionsJoined;
