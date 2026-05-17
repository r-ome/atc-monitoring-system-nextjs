"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  AuctionTransaction,
  REFUND_PURPOSES,
} from "src/entities/models/Payment";
import { cn, formatNumberToCurrency } from "@/app/lib/utils";
import { SortableHeader } from "@/app/(protected)/auctions/components/SortableHeader";

export const columns: ColumnDef<AuctionTransaction>[] = [
  {
    accessorKey: "created_at",
    size: 170,
    header: ({ column }) => (
      <SortableHeader column={column} label="Date & Time" />
    ),
    sortingFn: (rowA, rowB, columnId) => {
      const a = new Date(rowA.getValue<string>(columnId)).getTime();
      const b = new Date(rowB.getValue<string>(columnId)).getTime();
      return a - b;
    },
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground">
        {row.original.created_at}
      </span>
    ),
  },
  {
    accessorKey: "total_amount_paid",
    size: 140,
    header: ({ column }) => (
      <SortableHeader column={column} label="Amount" align="right" />
    ),
    cell: ({ row }) => {
      const t = row.original;
      const isRefund = REFUND_PURPOSES.includes(t.purpose);
      return (
        <div
          className={cn(
            "text-right font-mono font-semibold",
            isRefund ? "text-destructive" : "text-status-success",
          )}
        >
          {isRefund
            ? `(${formatNumberToCurrency(t.total_amount_paid)})`
            : formatNumberToCurrency(t.total_amount_paid)}
        </div>
      );
    },
  },
  {
    accessorKey: "receipt_number",
    size: 130,
    header: ({ column }) => (
      <SortableHeader column={column} label="Receipt" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-[12.5px] font-semibold">
        {row.original.receipt_number}
      </span>
    ),
  },
  {
    accessorKey: "bidder.bidder_number",
    size: 110,
    header: ({ column }) => <SortableHeader column={column} label="Bidder" />,
    cell: ({ row }) => (
      <span className="font-mono text-[12.5px] font-semibold text-muted-foreground">
        #{row.original.bidder.bidder_number}
      </span>
    ),
  },
  {
    accessorKey: "purpose",
    header: ({ column }) => (
      <SortableHeader column={column} label="Purpose" />
    ),
    cell: ({ row }) => {
      const t = row.original;
      const isRefund = REFUND_PURPOSES.includes(t.purpose);
      return (
        <span
          className={cn(
            "inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-semibold uppercase",
            isRefund
              ? "bg-destructive/10 text-destructive"
              : "bg-status-success/15 text-status-success",
          )}
          style={{ letterSpacing: "0.04em" }}
        >
          {t.purpose.replace(/_/g, " ")}
        </span>
      );
    },
  },
];
