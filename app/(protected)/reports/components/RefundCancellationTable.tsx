"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/app/components/data-table/data-table";
import { AuctionStatusBadge } from "@/app/components/admin";
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
import { SearchComponent } from "@/app/components/data-table/SearchComponent";

const parseDisplayDate = (value: string) => new Date(value).getTime();

const columns: ColumnDef<RefundCancellationEntry>[] = [
  {
    accessorKey: "auction_date",
    sortingFn: (rowA, rowB) =>
      parseDisplayDate(rowA.original.auction_date) -
      parseDisplayDate(rowB.original.auction_date),
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Auction Date <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.auction_date}</div>
    ),
  },
  {
    accessorKey: "status_date",
    sortingFn: (rowA, rowB) =>
      parseDisplayDate(rowA.original.status_date) -
      parseDisplayDate(rowB.original.status_date),
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cancelled Date <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.status_date}</div>
    ),
  },
  {
    accessorKey: "bidder_number",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Bidder # <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="mx-auto block text-center font-medium"
          >
            {row.original.bidder_number}
          </button>
        </TooltipTrigger>
        <TooltipContent>{row.original.bidder_name}</TooltipContent>
      </Tooltip>
    ),
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
          <div>
            <span className="font-semibold">Barcode:</span>{" "}
            {row.original.barcode}
          </div>
          {row.original.control && (
            <div>
              <span className="font-semibold">Control:</span>{" "}
              {row.original.control}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
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
    cell: ({ row }) => (
      <div className="flex justify-center">
        <AuctionStatusBadge status={row.original.status as "CANCELLED" | "REFUNDED"} />
      </div>
    ),
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
            className="mx-auto block max-w-[160px] cursor-help overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm text-muted-foreground"
          >
            {row.original.reason || "—"}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-80 space-y-1 whitespace-normal break-words text-center"
        >
          <div>{row.original.reason || "—"}</div>
          {row.original.updated_by && (
            <div className="text-xs font-medium text-white/80">
              By: {row.original.updated_by}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    ),
  },
];

interface Props {
  data: RefundCancellationEntry[];
}

export const RefundCancellationTable = ({ data }: Props) => {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data;

    return data.filter((row) =>
      [
        row.auction_date,
        row.status_date,
        row.bidder_number,
        row.bidder_name,
        row.description,
        row.barcode,
        row.control,
        row.status,
        row.reason,
        row.updated_by,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [data, search]);

  const refunded = filteredData.filter((d) => d.status === "REFUNDED");
  const cancelled = filteredData.filter((d) => d.status === "CANCELLED");
  const totalRefundedValue = refunded.reduce((sum, d) => sum + d.price, 0);
  const totalCancelledValue = cancelled.reduce((sum, d) => sum + d.price, 0);
  const totalAffectedValue = totalRefundedValue + totalCancelledValue;

  return (
    <DataTable
      title={
        <div className="flex flex-col gap-3">
          <div className="w-full md:w-2/5">
            <SearchComponent
              value={search}
              onChangeEvent={setSearch}
              placeholder="Search bidder, item, barcode, reason, or status..."
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <span>
              Refunded:{" "}
              <span className="text-orange-500 font-semibold">
                {refunded.length}
              </span>
            </span>
            <span>
              Cancelled:{" "}
              <span className="text-muted-foreground font-semibold">
                {cancelled.length}
              </span>
            </span>
            <span>
              Cancelled Value:{" "}
              <span className="font-semibold">
                {formatNumberToCurrency(totalCancelledValue)}
              </span>
            </span>
            <span>
              Refunded Value:{" "}
              <span className="text-red-500 font-semibold">
                {formatNumberToCurrency(totalRefundedValue)}
              </span>
            </span>
            <span>
              Total Affected Value:{" "}
              <span className="font-semibold">
                {formatNumberToCurrency(totalAffectedValue)}
              </span>
            </span>
          </div>
        </div>
      }
      columns={columns}
      data={filteredData}
      initialSorting={[{ id: "auction_date", desc: true }]}
    />
  );
};
