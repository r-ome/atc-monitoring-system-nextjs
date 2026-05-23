"use client";

import { useMemo, useState } from "react";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { AuctionStatusBadge } from "@/app/components/admin";
import { ColumnDef, CoreRow, Row } from "@tanstack/react-table";
import { RefundCancellationEntry } from "src/entities/models/Report";
import {
  CANCEL_REFUND_TAG_LABELS,
  CANCEL_REFUND_TAG_VALUES,
} from "src/entities/models/InventoryHistoryRemark";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown, Receipt } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { FilterColumnComponent } from "@/app/components/data-table/FilterColumnComponent";
import { UpdateTagModal } from "./UpdateTagModal";

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
          {row.original.tag && (
            <div>
              <span className="font-semibold">Tag:</span>{" "}
              {CANCEL_REFUND_TAG_LABELS[row.original.tag]}
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
          className="max-w-80 space-y-1.5 whitespace-normal break-words text-center"
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
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [selectedEntry, setSelectedEntry] =
    useState<RefundCancellationEntry | null>(null);

  const filteredData = useMemo(() => {
    if (tagFilter.length === 0) return data;
    return data.filter((d) => d.tag && tagFilter.includes(d.tag));
  }, [data, tagFilter]);

  const refunded = filteredData.filter((d) => d.status === "REFUNDED");
  const cancelled = filteredData.filter((d) => d.status === "CANCELLED");
  const totalRefundedValue = refunded.reduce((sum, d) => sum + d.price, 0);
  const totalCancelledValue = cancelled.reduce((sum, d) => sum + d.price, 0);
  const totalAffectedValue = totalRefundedValue + totalCancelledValue;

  const tagOptions = useMemo(() => {
    const present = new Set(data.map((d) => d.tag).filter(Boolean) as string[]);
    return CANCEL_REFUND_TAG_VALUES.filter((tag) => present.has(tag)).map(
      (tag) => ({ value: tag, label: CANCEL_REFUND_TAG_LABELS[tag] }),
    );
  }, [data]);

  const globalFilterFn = (
    row: CoreRow<RefundCancellationEntry>,
    _columnId?: string,
    filterValue?: string,
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const r = row.original;
    return [
      r.auction_date,
      r.status_date,
      r.bidder_number,
      r.bidder_name,
      r.description,
      r.barcode,
      r.control,
      r.status,
      r.reason,
      r.tag,
      r.tag ? CANCEL_REFUND_TAG_LABELS[r.tag] : null,
      r.updated_by,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  };

  const renderMobileCard = (row: Row<RefundCancellationEntry>) => {
    const r = row.original;
    return (
      <div className="flex flex-col gap-1 px-4 py-3">
        <div className="flex items-center gap-2">
          <AuctionStatusBadge status={r.status as "CANCELLED" | "REFUNDED"} />
          <span className="ml-auto font-mono text-[14.5px] font-bold text-red-500">
            {formatNumberToCurrency(r.price)}
          </span>
        </div>
        <div className="text-[14.5px] font-medium">{r.description}</div>
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className="font-mono">#{r.bidder_number}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{r.bidder_name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span>Auction {r.auction_date}</span>
          <span aria-hidden>·</span>
          <span>{r.status === "REFUNDED" ? "Refunded" : "Cancelled"} {r.status_date}</span>
        </div>
        {r.reason ? (
          <div className="text-[13px] text-muted-foreground">
            <span className="font-semibold">Reason:</span> {r.reason}
          </div>
        ) : null}
        {r.tag ? (
          <div className="text-[13px] text-muted-foreground">
            <span className="font-semibold">Tag:</span>{" "}
            {CANCEL_REFUND_TAG_LABELS[r.tag]}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
    <AuctionDataTable
      icon={Receipt}
      title="Refunds & Cancellations"
      meta={
        <span>
          <span className="text-orange-500 font-semibold">
            {refunded.length}
          </span>{" "}
          refunded ·{" "}
          <span className="font-semibold">{cancelled.length}</span> cancelled ·{" "}
          <span className="text-red-500 font-semibold">
            {formatNumberToCurrency(totalAffectedValue)}
          </span>{" "}
          affected
        </span>
      }
      rowLabel="entry"
      renderMobileCard={renderMobileCard}
      columns={columns}
      data={filteredData}
      initialSorting={[{ id: "auction_date", desc: true }]}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search bidder, item, barcode, reason, or status...",
        },
      }}
      actionButtons={
        tagOptions.length > 0 ? (
          <FilterColumnComponent
            options={tagOptions}
            defaultValue={tagFilter}
            onChangeEvent={setTagFilter}
            placeholder="Filter by tag"
          />
        ) : null
      }
      onRowClick={(row) => setSelectedEntry(row)}
    />
    <UpdateTagModal
      entry={selectedEntry}
      open={selectedEntry !== null}
      onOpenChange={(open) => {
        if (!open) setSelectedEntry(null);
      }}
    />
    </>
  );
};
