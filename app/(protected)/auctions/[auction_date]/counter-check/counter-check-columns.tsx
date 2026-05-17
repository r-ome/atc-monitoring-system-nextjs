"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { CounterCheck } from "src/entities/models/CounterCheck";
import { SortableHeader } from "@/app/(protected)/auctions/components/SortableHeader";

export const columns = (): ColumnDef<CounterCheck>[] => [
  {
    accessorKey: "description",
    header: ({ column }) => (
      <SortableHeader column={column} label="Description" />
    ),
    cell: ({ row }) => (
      <span className="text-foreground/90">{row.original.description}</span>
    ),
  },
  {
    accessorKey: "time",
    size: 90,
    header: ({ column }) => <SortableHeader column={column} label="Time" />,
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground">{row.original.time}</span>
    ),
  },
  {
    accessorKey: "control",
    size: 100,
    header: ({ column }) => (
      <SortableHeader column={column} label="Control #" />
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.original.control}</span>
    ),
  },
  {
    accessorKey: "bidder_number",
    size: 90,
    header: ({ column }) => <SortableHeader column={column} label="Bidder" />,
    cell: ({ row }) => {
      const v = row.original.bidder_number;
      if (v === "0000") {
        return (
          <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase text-destructive">
            No bidder
          </span>
        );
      }
      return (
        <span className="font-mono text-[12.5px] font-semibold text-muted-foreground">
          #{v}
        </span>
      );
    },
  },
  {
    accessorKey: "price",
    size: 110,
    header: ({ column }) => (
      <SortableHeader column={column} label="Price" align="right" />
    ),
    cell: ({ row }) => {
      const raw = row.original.price;
      if (!raw) {
        return (
          <div className="text-right">
            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase text-destructive">
              No price
            </span>
          </div>
        );
      }
      return (
        <div className="text-right font-mono font-medium">
          {formatNumberToCurrency(parseInt(raw, 10))}
        </div>
      );
    },
  },
  {
    accessorKey: "page",
    size: 70,
    header: ({ column }) => (
      <SortableHeader column={column} label="Page" align="right" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono text-muted-foreground">
        {row.original.page}
      </div>
    ),
  },
  {
    accessorKey: "remarks",
    header: ({ column }) => (
      <SortableHeader column={column} label="Remarks" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.remarks}</span>
    ),
  },
];
