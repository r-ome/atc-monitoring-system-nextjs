"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SellThroughEntry } from "src/entities/models/Report";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";

const columns: ColumnDef<SellThroughEntry>[] = [
  {
    accessorKey: "auction_date",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Auction Date <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="flex justify-center">{row.original.auction_date}</div>,
  },
  {
    accessorKey: "total",
    header: () => <div className="text-center">Total Items</div>,
    cell: ({ row }) => <div className="flex justify-center font-semibold">{row.original.total}</div>,
  },
  {
    accessorKey: "paid",
    header: () => <div className="text-center">Paid</div>,
    cell: ({ row }) => <div className="flex justify-center text-green-500">{row.original.paid}</div>,
  },
  {
    accessorKey: "unpaid",
    header: () => <div className="text-center">Unpaid</div>,
    cell: ({ row }) => <div className="flex justify-center text-red-500">{row.original.unpaid}</div>,
  },
  {
    accessorKey: "cancelled",
    header: () => <div className="text-center">Cancelled</div>,
    cell: ({ row }) => <div className="flex justify-center text-muted-foreground">{row.original.cancelled}</div>,
  },
  {
    accessorKey: "refunded",
    header: () => <div className="text-center">Refunded</div>,
    cell: ({ row }) => <div className="flex justify-center text-orange-500">{row.original.refunded}</div>,
  },
  {
    accessorKey: "sell_through_rate",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Sell-Through % <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const rate = row.original.sell_through_rate;
      const color = rate >= 80 ? "text-green-500" : rate >= 50 ? "text-yellow-500" : "text-red-500";
      return <div className={`flex justify-center font-semibold ${color}`}>{rate}%</div>;
    },
  },
];

interface Props {
  data: SellThroughEntry[];
}

export const SellThroughTable = ({ data }: Props) => {
  const totalItems = data.reduce((sum, d) => sum + d.total, 0);
  const totalPaid = data.reduce((sum, d) => sum + d.paid, 0);
  const avgRate = totalItems > 0 ? Math.round((totalPaid / totalItems) * 100) : 0;
  const rateColor = avgRate >= 80 ? "text-green-500" : avgRate >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <DataTable
      title={
        <div className="flex gap-6">
          <span>Total Items: <span className="font-semibold">{totalItems}</span></span>
          <span>Sold: <span className="text-green-500 font-semibold">{totalPaid}</span></span>
          <span>Avg Sell-Through: <span className={`font-semibold ${rateColor}`}>{avgRate}%</span></span>
        </div>
      }
      columns={columns}
      data={data}
    />
  );
};
