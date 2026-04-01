"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { RefundCancellationEntry } from "src/entities/models/Report";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

const columns: ColumnDef<RefundCancellationEntry>[] = [
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
    accessorKey: "bidder_number",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Bidder # <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="flex justify-center font-medium">{row.original.bidder_number}</div>,
  },
  {
    accessorKey: "bidder_name",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="flex justify-center">{row.original.bidder_name}</div>,
  },
  {
    accessorKey: "description",
    header: () => <div className="text-center">Description</div>,
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex justify-center text-center cursor-default">
            {row.original.description}
          </div>
        </TooltipTrigger>
        <TooltipContent className="space-y-1 text-xs">
          <div><span className="font-semibold">Barcode:</span> {row.original.barcode}</div>
          {row.original.control && (
            <div><span className="font-semibold">Control:</span> {row.original.control}</div>
          )}
        </TooltipContent>
      </Tooltip>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Price <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-red-500">
        {formatNumberToCurrency(row.original.price)}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      const color = status === "REFUNDED" ? "text-orange-500" : "text-muted-foreground";
      return <div className={`flex justify-center font-medium ${color}`}>{status}</div>;
    },
  },
  {
    accessorKey: "reason",
    size: 240,
    header: () => <div className="text-center">Reason</div>,
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="mx-auto block max-w-[240px] cursor-help overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm text-muted-foreground"
          >
            {row.original.reason || "—"}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-80 whitespace-normal break-words text-center">
          {row.original.reason || "—"}
        </TooltipContent>
      </Tooltip>
    ),
  },
];

interface Props {
  data: RefundCancellationEntry[];
}

export const RefundCancellationTable = ({ data }: Props) => {
  const refunded = data.filter((d) => d.status === "REFUNDED");
  const cancelled = data.filter((d) => d.status === "CANCELLED");
  const totalRefundedValue = refunded.reduce((sum, d) => sum + d.price, 0);

  return (
    <DataTable
      title={
        <div className="flex flex-wrap gap-6">
          <span>Refunded: <span className="text-orange-500 font-semibold">{refunded.length}</span></span>
          <span>Cancelled: <span className="text-muted-foreground font-semibold">{cancelled.length}</span></span>
          <span>Refunded Value: <span className="text-red-500 font-semibold">{formatNumberToCurrency(totalRefundedValue)}</span></span>
        </div>
      }
      columns={columns}
      data={data}
      initialSorting={[{ id: "auction_date", desc: true }]}
    />
  );
};
