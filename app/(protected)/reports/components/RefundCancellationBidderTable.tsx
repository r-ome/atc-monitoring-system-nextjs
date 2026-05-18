"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef, Row } from "@tanstack/react-table";
import { RefundCancellationBidderEntry, RefundCancellationEntry } from "src/entities/models/Report";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";

const columns: ColumnDef<RefundCancellationBidderEntry>[] = [
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
    accessorKey: "refunded",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Refunded <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-orange-500 font-medium">
        {row.original.refunded}
      </div>
    ),
  },
  {
    accessorKey: "cancelled",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Cancelled <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-muted-foreground font-medium">
        {row.original.cancelled}
      </div>
    ),
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total Affected <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="flex justify-center font-semibold">{row.original.total}</div>,
  },
];

interface Props {
  data: RefundCancellationEntry[];
}

export const RefundCancellationBidderTable = ({ data }: Props) => {
  const bidderRows: RefundCancellationBidderEntry[] = Array.from(
    data.reduce(
      (map, row) => {
        const key = row.bidder_number;
        const current = map.get(key) ?? {
          bidder_number: row.bidder_number,
          bidder_name: row.bidder_name,
          refunded: 0,
          cancelled: 0,
          total: 0,
        };

        if (row.status === "REFUNDED") current.refunded += 1;
        if (row.status === "CANCELLED") current.cancelled += 1;
        current.total += 1;

        map.set(key, current);
        return map;
      },
      new Map<string, RefundCancellationBidderEntry>(),
    ).values(),
  ).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.refunded !== a.refunded) return b.refunded - a.refunded;
    return a.bidder_number.localeCompare(b.bidder_number);
  });

  const renderMobileCard = (row: Row<RefundCancellationBidderEntry>) => {
    const b = row.original;
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="font-mono text-[12px] font-semibold text-muted-foreground">
          #{b.bidder_number}
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[13px] font-medium">
            {b.bidder_name}
          </span>
          <span className="text-[11px] text-muted-foreground">
            <span className="text-orange-500 font-medium">
              {b.refunded} refunded
            </span>{" "}
            ·{" "}
            <span className="text-muted-foreground font-medium">
              {b.cancelled} cancelled
            </span>
          </span>
        </div>
        <span className="font-mono text-[13px] font-bold">{b.total}</span>
      </div>
    );
  };

  return (
    <DataTable
      columns={columns}
      data={bidderRows}
      initialSorting={[{ id: "total", desc: true }]}
      pageSize={10}
      renderMobileCard={renderMobileCard}
    />
  );
};
