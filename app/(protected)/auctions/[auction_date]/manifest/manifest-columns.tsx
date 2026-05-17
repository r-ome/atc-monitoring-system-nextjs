"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Manifest } from "src/entities/models/Manifest";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn, formatDate, formatNumberToCurrency } from "@/app/lib/utils";
import { SetStateAction } from "react";
import { createGroupSortingFn } from "@/app/lib/utils";
import { SortableHeader } from "@/app/(protected)/auctions/components/SortableHeader";
import { AuctionStatusPill } from "@/app/(protected)/auctions/components/AuctionStatusPill";

const controlGroupSortingFn = createGroupSortingFn<Manifest, string>(
  (row) => row.is_slash_item ?? row.manifest_id,
  (row) => row.control ?? "",
  (a, b) => a.localeCompare(b),
);

function ManifestNumberDisplay({
  manifestNumber,
}: {
  manifestNumber: string | null;
}) {
  if (manifestNumber === "ADD ON") {
    return <AuctionStatusPill status="ADD ON" />;
  }
  if (manifestNumber === "BOUGHT ITEM") {
    return <AuctionStatusPill status="BOUGHT ITEM" />;
  }
  return (
    <span className="font-mono">
      {manifestNumber ?? <span className="text-muted-foreground/60">—</span>}
    </span>
  );
}

export const columns = (
  setOpen: React.Dispatch<SetStateAction<boolean>>,
  setSelected: React.Dispatch<SetStateAction<Manifest>>,
  groupIndexMap: Record<string, number>,
): ColumnDef<Manifest>[] => [
  {
    accessorKey: "barcode",
    size: 110,
    header: ({ column }) => <SortableHeader column={column} label="Barcode" />,
    cell: ({ row }) => {
      const m = row.original;
      return (
        <span
          className={cn(
            "font-mono text-[12.5px] font-semibold",
            m.error_message && "cursor-pointer hover:underline",
          )}
          onClick={() => {
            if (m.error_message) {
              setOpen(true);
              setSelected(m);
            }
          }}
        >
          {m.barcode}
        </span>
      );
    },
  },
  {
    accessorKey: "control",
    size: 100,
    sortingFn: controlGroupSortingFn,
    header: ({ column }) => (
      <SortableHeader column={column} label="Control" />
    ),
    cell: ({ row }) => {
      const m = row.original;
      const is_slash_item = m.is_slash_item;
      const idx = is_slash_item ? groupIndexMap[is_slash_item] : undefined;
      return (
        <span className="font-mono">
          {m.control}
          {idx ? `(A${idx})` : ""}
        </span>
      );
    },
  },
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
    accessorKey: "bidder_number",
    size: 90,
    header: ({ column }) => <SortableHeader column={column} label="Bidder" />,
    cell: ({ row }) => (
      <span className="font-mono text-[12.5px] font-semibold text-muted-foreground">
        #{row.original.bidder_number}
      </span>
    ),
  },
  {
    accessorKey: "qty",
    size: 70,
    header: ({ column }) => (
      <SortableHeader column={column} label="Qty" align="right" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono">{row.original.qty}</div>
    ),
  },
  {
    accessorKey: "price",
    size: 110,
    header: ({ column }) => (
      <SortableHeader column={column} label="Price" align="right" />
    ),
    cell: ({ row }) => {
      const raw = row.original.price;
      return (
        <div className="text-right font-mono font-medium">
          {raw ? (
            formatNumberToCurrency(parseInt(raw, 10))
          ) : (
            <span className="text-muted-foreground/60">—</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "manifest_number",
    size: 100,
    header: ({ column }) => (
      <SortableHeader column={column} label="Manifest" />
    ),
    cell: ({ row }) => {
      const m = row.original;
      const node = <ManifestNumberDisplay manifestNumber={m.manifest_number} />;
      if (!m.remarks) return node;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">{node}</span>
          </TooltipTrigger>
          <TooltipContent>Uploaded by: {m.remarks}</TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "created_at",
    size: 90,
    header: ({ column }) => <SortableHeader column={column} label="Time" />,
    cell: ({ row }) => {
      const insertedAt = new Date(row.original.created_at);
      const visibleTime = formatDate(insertedAt, "hh:mm a");
      const full = formatDate(insertedAt, "MMMM dd, yyyy hh:mm:ss a");
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default font-mono text-muted-foreground">
              {visibleTime}
            </span>
          </TooltipTrigger>
          <TooltipContent>{full}</TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "error_message",
    size: 140,
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    cell: ({ row }) => {
      const m = row.original;
      if (!m.error_message) {
        return <AuctionStatusPill status="ENCODED" />;
      }
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">
              <AuctionStatusPill status="ERROR" />
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">
            {m.error_message}
          </TooltipContent>
        </Tooltip>
      );
    },
  },
];
