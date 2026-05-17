"use client";

import { usePathname, useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { AuctionsInventory } from "src/entities/models/Auction";
import { createGroupSortingFn } from "@/app/lib/utils";
import { cn, formatNumberToCurrency } from "@/app/lib/utils";
import { CounterCheck } from "src/entities/models/CounterCheck";
import { AuctionStatusPill } from "@/app/(protected)/auctions/components/AuctionStatusPill";
import { SortableHeader } from "@/app/(protected)/auctions/components/SortableHeader";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

const controlGroupSortingFn = createGroupSortingFn<AuctionsInventory, string>(
  (row) => row.is_slash_item ?? row.auction_inventory_id,
  (row) => row.inventory.control,
  (a, b) => a.localeCompare(b),
);

function MonitoringBarcodeCell({
  auctionInventoryId,
  barcode,
  isMasterList,
}: {
  auctionInventoryId: string;
  barcode: string;
  isMasterList: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <span
      className={cn(
        "font-mono text-[12.5px] font-semibold",
        !isMasterList && "cursor-pointer hover:underline",
      )}
      onClick={() => {
        if (!isMasterList) {
          router.push(`${pathname}/${auctionInventoryId}`);
        }
      }}
    >
      {barcode}
    </span>
  );
}

export const columns = (
  slashGroupMap: Record<string, number>,
  isMasterList = false,
  counterCheck: CounterCheck[] = [],
): ColumnDef<AuctionsInventory>[] => [
  {
    accessorKey: "inventory.barcode",
    size: 110,
    header: ({ column }) => <SortableHeader column={column} label="Barcode" />,
    cell: ({ row }) => (
      <MonitoringBarcodeCell
        auctionInventoryId={row.original.auction_inventory_id}
        barcode={row.original.inventory.barcode}
        isMasterList={isMasterList}
      />
    ),
  },
  {
    accessorKey: "inventory.control",
    enableResizing: true,
    size: 100,
    sortingFn: controlGroupSortingFn,
    header: ({ column }) => (
      <SortableHeader column={column} label="Control #" />
    ),
    cell: ({ row }) => {
      const auction_inventory = row.original;
      const is_slash_item = auction_inventory.is_slash_item;
      const idx = is_slash_item ? slashGroupMap[is_slash_item] : undefined;

      const counterChecks = counterCheck.filter(
        (item) =>
          item.control === auction_inventory.inventory.control &&
          item.bidder_number === auction_inventory.bidder.bidder_number,
      );

      const label = (
        <span className="font-mono">
          {auction_inventory.inventory.control}
          {idx ? `(A${idx})` : ""}
        </span>
      );

      if (isMasterList || !counterChecks.length) {
        return label;
      }

      return (
        <Popover>
          <PopoverTrigger asChild>
            <span className="cursor-pointer underline decoration-dotted underline-offset-2">
              {label}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0">
            <Table className="border">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-bold">CONTROL</TableHead>
                  <TableHead className="text-center font-bold">PRICE</TableHead>
                  <TableHead className="text-center font-bold">PAGE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counterChecks.map((item) => (
                  <TableRow key={item.counter_check_id}>
                    <TableCell className="text-center">{item.control}</TableCell>
                    <TableCell className="text-center font-mono">
                      {parseInt(item.price ?? "", 10)?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">{item.page}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </PopoverContent>
        </Popover>
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
    accessorKey: "qty",
    size: 70,
    header: ({ column }) => (
      <SortableHeader column={column} label="Qty" align="right" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {row.original.qty === "0.5" ? "½" : row.original.qty}
      </div>
    ),
  },
  {
    id: "auction_bidder.bidder.bidder_number",
    accessorFn: (row) => row.bidder.bidder_number,
    size: 90,
    header: ({ column }) => <SortableHeader column={column} label="Bidder" />,
    cell: ({ row }) => {
      const v = row.original.bidder.bidder_number;
      const label = v === "5013" ? "ATC" : `#${v}`;
      return (
        <span className="font-mono text-[12.5px] font-semibold text-muted-foreground">
          {label}
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
    cell: ({ row }) => (
      <div className="text-right font-mono font-medium">
        {formatNumberToCurrency(row.original.price)}
      </div>
    ),
  },
  {
    accessorKey: "status",
    size: 100,
    enableColumnFilter: true,
    filterFn: "includesIn",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    cell: ({ row }) => <AuctionStatusPill status={row.original.status} />,
  },
  {
    accessorKey: "manifest_number",
    size: 90,
    header: ({ column }) => (
      <SortableHeader column={column} label="Manifest" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground">
        {row.original.manifest_number || (
          <span className="text-muted-foreground/60">—</span>
        )}
      </span>
    ),
  },
  ...(isMasterList
    ? [
        {
          accessorKey: "auction_date",
          header: ({ column }) => (
            <SortableHeader column={column} label="Auction Date" />
          ),
          cell: ({ row }) => (
            <span className="text-muted-foreground">
              {row.original.auction_date}
            </span>
          ),
        } as ColumnDef<AuctionsInventory>,
      ]
    : []),
];
