"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { RegisteredBidderSummary } from "src/entities/models/Bidder";
import { cn, formatNumberToCurrency } from "@/app/lib/utils";
import { SortableHeader } from "@/app/(protected)/auctions/components/SortableHeader";

export const columns: ColumnDef<RegisteredBidderSummary>[] = [
  {
    accessorKey: "bidder.bidder_number",
    header: ({ column }) => (
      <SortableHeader column={column} label="Bidder" align="left" />
    ),
    cell: ({ row }) => {
      const rb = row.original;
      if (rb.bidder.bidder_number === "5013") {
        return (
          <span className="text-muted-foreground italic">CANCELLED ITEMS</span>
        );
      }
      const initials = rb.bidder.full_name
        .split(" ")
        .slice(0, 2)
        .map((s) => s[0])
        .join("");
      return (
        <div className="flex items-center justify-start gap-2.5 text-left">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10.5px] font-bold text-accent-foreground">
            {initials}
          </span>
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className="font-mono font-semibold">
              #{rb.bidder.bidder_number}
            </span>
            <span aria-hidden className="text-muted-foreground">·</span>
            <span className="truncate text-[13px] text-muted-foreground">
              {rb.bidder.full_name}
            </span>
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "registration_fee",
    size: 110,
    header: ({ column }) => (
      <SortableHeader column={column} label="Reg. Fee" align="right" />
    ),
    cell: ({ row }) => {
      const isCancelledBin = row.original.bidder.bidder_number === "5013";
      return (
        <div className="text-right font-mono">
          {isCancelledBin ? (
            <span className="text-muted-foreground/60">—</span>
          ) : (
            formatNumberToCurrency(row.original.registration_fee)
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "service_charge",
    size: 90,
    header: ({ column }) => (
      <SortableHeader column={column} label="Service" align="right" />
    ),
    cell: ({ row }) => {
      const isCancelledBin = row.original.bidder.bidder_number === "5013";
      return (
        <div className="text-right font-mono text-foreground/80">
          {isCancelledBin ? (
            <span className="text-muted-foreground/60">—</span>
          ) : (
            `${row.original.service_charge}%`
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "auction_inventories_count",
    size: 80,
    header: ({ column }) => (
      <SortableHeader column={column} label="Items" align="right" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {row.original.auction_inventories_count.toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "balance",
    size: 120,
    enableColumnFilter: true,
    filterFn: (row, _columnId, value) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return true;
      const rb = row.original;
      const isCancelledBin = rb.bidder.bidder_number === "5013";
      if (isCancelledBin) return false;
      const status = rb.balance === 0 ? "PAID" : "UNPAID";
      // UNPAID hides bidders who only have an unconsumed registration fee
      // (i.e. registered but bought nothing yet) — they aren't owed-money cases.
      if (status === "UNPAID" && rb.auction_inventories_count === 0) {
        return false;
      }
      return Array.isArray(value) ? value.includes(status) : status === value;
    },
    header: ({ column }) => (
      <SortableHeader column={column} label="Balance" align="right" />
    ),
    cell: ({ row }) => {
      const v = row.original.balance;
      const isCancelledBin = row.original.bidder.bidder_number === "5013";
      if (v === 0 && !isCancelledBin) {
        return (
          <div className="text-right">
            <span className="inline-block rounded bg-status-success/10 px-1.5 py-0.5 text-[12.5px] font-bold tracking-wider text-status-success">
              PAID
            </span>
          </div>
        );
      }
      if (v === 0) {
        return <div className="text-right text-muted-foreground/60">—</div>;
      }
      return (
        <div
          className={cn(
            "text-right font-mono font-semibold",
            v > 0 ? "text-destructive" : "text-status-success",
          )}
        >
          {formatNumberToCurrency(v)}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    size: 110,
    header: ({ column }) => (
      <SortableHeader column={column} label="Registered" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.created_at}</span>
    ),
  },
];
